#!/usr/bin/env node
// Owner maintenance CLI. Never mounted as a route and never uploads or writes to production.
import { readFile, writeFile, readdir, mkdir, stat, lstat, realpath, rename, unlink, open, copyFile } from 'node:fs/promises';
import { createReadStream, constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { prepareClips, probeVideo, runTool, validateIdentifiers } from './prepare-clips.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export function sourceId(url) {
  const u=new URL(url);
  assert.equal(u.protocol,'https:'); assert.ok(!u.username&&!u.password&&!u.hash);
  if(u.hostname==='www.youtube.com'&&u.pathname==='/watch'&&u.searchParams.size===1&&/^[\w-]{11}$/.test(u.searchParams.get('v')||'')) return u.searchParams.get('v');
  if(u.hostname==='x.com'&&/^\/Jorakeditor\/status\/\d+$/.test(u.pathname)&&!u.search) return u.pathname.split('/').at(-1);
  throw new Error('Only reviewed YouTube watch links or public Jorak posts are supported.');
}
export function validateSource(item) {
  validateIdentifiers(item); assert.equal(item.authorized,true,'The owner must authorize this source.');
  assert.ok(['exclusive-upload','explicit-range'].includes(item.proofKind),'Inferred boundaries are never downloaded as approved clips.');
  assert.ok(item.evidence?.length>20&&item.expectedAuthor&&item.originalUrl,'Document author, original and attribution.');
  if(item.proofKind==='exclusive-upload') assert.equal(item.expectedAuthor,item.sourceUrl.startsWith('https://x.com/')?'Jorakeditor':'UCF-jHvQ-q1N-zLheeUQRVcw','An exclusive upload must belong to the verified editor.');
  assert.ok(item.originalUrl.startsWith('https://www.youtube.com/watch?')); sourceId(item.originalUrl);
  assert.ok(['edit','trailer'].includes(item.kind)); assert.ok(['original','showcase'].includes(item.timeline));
  assert.ok(Number.isFinite(item.start)&&item.start>=0);
  if(item.posterAt!==undefined)assert.ok(Number.isFinite(item.posterAt)&&item.posterAt>=0,'Poster timestamp must be finite and positive.');
  if(item.proofKind==='explicit-range') assert.ok(Number.isFinite(item.end)&&item.end>item.start&&item.timeline==='original');
  else assert.ok(item.start===0&&item.end===null&&item.timeline==='showcase','Own upload durations come from FFprobe, not the original song.');
  return sourceId(item.sourceUrl);
}
async function safeDirectory(directory) {
  const local=path.join(root,'.local-data');
  const relative=path.relative(local,directory);
  assert.ok(!relative.startsWith('..')&&!path.isAbsolute(relative));
  let current=root;
  for(const part of path.relative(root,directory).split(path.sep)) {
    current=path.join(current,part);
    const info=await lstat(current).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    assert.ok(!info||info.isDirectory()&&!info.isSymbolicLink(),'Local media folders cannot be symlinks.');
  }
  await mkdir(directory,{recursive:true});
  assert.equal(await realpath(directory),directory);
}
async function hash(file) {
  const h=createHash('sha256'); for await(const c of createReadStream(file))h.update(c);return h.digest('hex');
}
async function exists(file) {return !!await stat(file).catch(()=>null);}

export function metadataIdentity(metadata,item) {
  // X identifies the video separately from the post. Never guess its filename from the post ID.
  assert.equal(metadata.webpage_url,item.sourceUrl,'Metadata belongs to a different source.');
  assert.match(metadata.id,/^[\w-]+$/,'Unsafe downloaded video identifier.');
  assert.equal(item.sourceUrl.startsWith('https://x.com/')?metadata.uploader_id:metadata.channel_id,item.expectedAuthor,'Unexpected source author.');
  assert.ok(['public','unlisted',null,undefined].includes(metadata.availability),'A private or restricted source is not permitted.');
  return metadata.id;
}
async function downloadedMetadata(directory,item) {
  const files=item.sourceUrl.startsWith('https://x.com/')
    ?(await readdir(directory)).filter(f=>/^\d+\.info\.json$/.test(f))
    :[`${sourceId(item.sourceUrl)}.info.json`];
  for(const file of files) {
    const metadataPath=path.join(directory,file),metadata=JSON.parse(await readFile(metadataPath,'utf8'));
    if(metadata.webpage_url!==item.sourceUrl)continue;
    const id=metadataIdentity(metadata,item);assert.equal(file,`${id}.info.json`);
    return {id,metadataPath};
  }
  throw new Error('No metadata matching the reviewed source URL.');
}

async function presentationAssets(result,ffmpeg,ffprobe,posterAt) {
  const folder=path.dirname(result.presentation.path),posterTime=posterAt??result.presentation.duration/2;
  assert.ok(posterTime<result.presentation.duration,'Poster must come from an existing frame.');
  const previewOffset=Math.min(5,result.presentation.duration/3),previewDuration=Math.min(8,result.presentation.duration-previewOffset);
  const temporaryPoster=path.join(folder,'poster.refresh.jpg'),temporaryPreview=path.join(folder,'preview.refresh.mp4');
  await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-n','-i',result.presentation.path,'-ss',String(posterTime),'-frames:v','1','-q:v','2',temporaryPoster]);
  await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-n','-i',result.presentation.path,'-ss',String(previewOffset),'-t',String(previewDuration),'-an','-vf',`scale=${result.preview.width}:${result.preview.height}:flags=lanczos,setsar=1,fps=${result.preview.fps}`,'-c:v','libx264','-preset','fast','-crf','28','-pix_fmt','yuv420p','-threads','2','-map_metadata','-1','-map_chapters','-1','-movflags','+faststart',temporaryPreview],{timeout:120000});
  const posterPath=path.join(folder,'poster.jpg'),previewPath=path.join(folder,'preview.mp4');
  await rename(temporaryPoster,posterPath);await rename(temporaryPreview,previewPath);
  result.poster={path:posterPath,sha256:await hash(posterPath),bytes:(await stat(posterPath)).size,frameAt:posterTime};
  result.preview={path:previewPath,...await probeVideo(previewPath,ffprobe),sha256:await hash(previewPath),bytes:(await stat(previewPath)).size,sourceStart:previewOffset};
  assert.equal(result.preview.audioStream,null);assert.ok(result.preview.duration<=8.12);
}
async function mobileAsset(result,ffmpeg,ffprobe) {
  if(result.mobile){assert.equal(path.dirname(result.mobile.path),path.dirname(result.presentation.path));assert.equal(await hash(result.mobile.path),result.mobile.sha256);return;}
  const ratio=Math.min(1,1280/result.presentation.width,720/result.presentation.height);
  const width=Math.floor(result.presentation.width*ratio/2)*2,height=Math.floor(result.presentation.height*ratio/2)*2;
  const temporary=path.join(path.dirname(result.presentation.path),'mobile.partial.mp4'),destination=path.join(path.dirname(result.presentation.path),'mobile.mp4');
  assert.ok(!await exists(destination),'A mobile output already exists without a verified manifest.');
  await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-n','-i',result.presentation.path,'-vf',`scale=${width}:${height}:flags=lanczos,setsar=1`,'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-threads','2','-c:a','aac','-b:a','160k','-map_metadata','-1','-map_chapters','-1','-movflags','+faststart',temporary],{timeout:300000});
  const info=await probeVideo(temporary,ffprobe);assert.ok(info.audioStream!==null&&Math.abs(info.duration-result.presentation.duration)<0.12);
  assert.ok(Math.abs(info.width/info.height-result.presentation.width/result.presentation.height)<0.005);
  await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-i',temporary,'-f','null','-'],{timeout:120000});
  await rename(temporary,destination);
  result.mobile={path:destination,...info,sha256:await hash(destination),bytes:(await stat(destination)).size,decoded:true};
}
export async function acquire({planPath=path.join(root,'data/media-sources.json'),ytDlp='yt-dlp',ffmpeg='ffmpeg',ffprobe='ffprobe',execute=false,importLocal=false,refreshAssets=false}) {
  const plan=JSON.parse(await readFile(planPath,'utf8'));assert.equal(plan.version,1);assert.ok(plan.sources.length>0&&plan.sources.length<=1000);
  const seen=new Set(); for(const item of plan.sources){validateSource(item);const k=`${item.projectSlug}/${item.segmentId}`;assert.ok(!seen.has(k));seen.add(k);}
  if(!execute)return {mode:'dry-run',sources:plan.sources.length,projects:new Set(plan.sources.map(i=>i.projectSlug)).size};
  const originals=path.join(root,'.local-data/originals'); await safeDirectory(originals);
  const ffmpegDirectory=path.dirname(path.resolve(ffmpeg)); const results=[]; const failures=[];
  const processItem=async(item)=>{
    validateSource(item);const destination=path.join(root,'.local-data/clips',item.projectSlug,item.segmentId);
    const output=path.join(destination,'export.json');
    try {
      let result;
      const cached=await exists(output);
      if(cached) {
        result=JSON.parse(await readFile(output,'utf8'));
        assert.equal(result.sourceUrl,item.sourceUrl);assert.equal(result.start,item.start);
        if(item.end!==null)assert.equal(result.end,item.end);
        assert.equal(result.original.sha256,await hash(result.original.path),'Cached original changed.');
        for(const media of [result.presentation,result.preview,result.poster]) {
          assert.ok(media&&path.dirname(media.path)===destination);assert.equal(await hash(media.path),media.sha256,'Cached media changed.');
        }
      } else {
        await runTool(ytDlp,['--ignore-config','--js-runtimes','node','--no-playlist','--no-overwrites','--no-progress',
          '--socket-timeout','20','--retries','1','--fragment-retries','1','--ffmpeg-location',ffmpegDirectory,
          '--format','bv*+ba/b','--merge-output-format','mkv','--write-info-json','--output',path.join(originals,'%(id)s.%(ext)s'),item.sourceUrl],{timeout:600000});
        const {id:downloadedId,metadataPath}=await downloadedMetadata(originals,item);
        let input;
        for(const ext of ['mkv','mp4','webm']){const candidate=path.join(originals,`${downloadedId}.${ext}`);if(await exists(candidate)){input=candidate;break;}}
        assert.ok(input,'No downloaded video file.');
        const info=await probeVideo(input,ffprobe);assert.ok(info.audioStream!==null,'The real portfolio clip must include audio.');
        const end=item.end??info.duration;
        const manifest=path.join(originals,`input-${item.projectSlug}-${item.segmentId}.json`);
        await writeFile(manifest,JSON.stringify({version:1,clips:[{projectSlug:item.projectSlug,segmentId:item.segmentId,input,start:item.start,end,authorized:true,rangeConfirmed:true,evidence:item.evidence,sourceUrl:item.sourceUrl}]}));
        result=(await prepareClips({manifestPath:manifest,workspace:root,ffmpeg,ffprobe,execute:true})).clips[0];
        await presentationAssets(result,ffmpeg,ffprobe,item.posterAt);
        // Decode every real presentation and preview; verify non-silent audio, without synthetic substitutes.
        await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-i',result.presentation.path,'-f','null','-'],{timeout:300000});
        await runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-i',result.preview.path,'-f','null','-'],{timeout:120000});
        const audio=await runTool(ffmpeg,['-hide_banner','-nostdin','-i',result.presentation.path,'-vn','-af','volumedetect','-f','null','-'],{timeout:120000});
        const max=/max_volume: ([\d.-]+) dB/.exec(audio.stderr);assert.ok(max&&Number(max[1])>-70,'Unexpectedly silent audio.');
        result.audioValidation={maxDb:Number(max[1]),decoded:true};result.timeline=item.timeline;result.kind=item.kind;
        result.metadataSha256=await hash(metadataPath);
        await writeFile(output,JSON.stringify(result,null,2));
      }
      result.evidence=item.evidence;result.timeline=item.timeline;result.kind=item.kind;
      if(refreshAssets&&cached){await presentationAssets(result,ffmpeg,ffprobe,item.posterAt);await writeFile(output,JSON.stringify(result,null,2));}
      await mobileAsset(result,ffmpeg,ffprobe);await writeFile(output,JSON.stringify(result,null,2));
      results.push({...result,timeline:item.timeline,kind:item.kind});console.log(`Ready: ${item.projectSlug} / ${item.segmentId}`);
    }catch(error){failures.push({projectSlug:item.projectSlug,sourceUrl:item.sourceUrl,message:error.message});console.error(`Pending: ${item.projectSlug}: ${error.message}`);}
  };
  // Independent files only. Two encoders keep CPU and memory bounded.
  let next=0;await Promise.all(Array.from({length:2},async()=>{while(next<plan.sources.length)await processItem(plan.sources[next++]);}));
  const report={version:1,createdAt:new Date().toISOString(),publication:'local-only',results,failures};
  await writeFile(path.join(root,'.local-data/media-export-report.json'),JSON.stringify(report,null,2));
  if(importLocal)await importResults(report);
  return report;
}
export async function importResults(report) {
  const env=await readFile(path.join(root,'.env.local'),'utf8');assert.match(env,/^PORTFOLIO_MODE=local\s*$/m,'Import requires loopback local mode.');
  const directory=path.resolve(root,/^PORTFOLIO_DATA_DIR=(.+)$/m.exec(env)?.[1].trim()||'.local-data');
  await safeDirectory(directory);const uploads=path.join(directory,'uploads');await safeDirectory(uploads);
  const lockPath=path.join(directory,'.write-lock'),lock=await open(lockPath,'wx',0o600);
  try {
    const file=path.join(directory,'portfolio.json'),original=await readFile(file,'utf8'),data=JSON.parse(original);
    await writeFile(path.join(directory,`media-backup-${randomUUID()}.json`),original,{flag:'wx',mode:0o600});
    for(const result of report.results) {
      const project=data.projects.find(p=>p.slug===result.projectSlug);assert.ok(project,'Unknown project.');
      let segment=result.timeline==='original'
        ?project.segments.find(s=>s.id!==result.segmentId&&s.timeline!=='showcase'&&s.start===result.start&&s.end===result.end)||project.segments.find(s=>s.id===result.segmentId)
        :project.segments.find(s=>s.id===result.segmentId);
      const targetId=segment?.id||result.segmentId;
      const fingerprint=[result.presentation.sha256,result.mobile?.sha256,result.preview.sha256,result.poster.sha256].join(':');
      if(segment?.clipUrl&&segment.mobileClipUrl&&segment.previewUrl&&segment.posterUrl&&segment.mediaFingerprint===fingerprint)continue;
      const urls={};
      for(const [key,media] of Object.entries({clipUrl:result.presentation,...(result.mobile?{mobileClipUrl:result.mobile}:{}),previewUrl:result.preview,posterUrl:result.poster})) {
        assert.equal(path.dirname(media.path),path.join(root,'.local-data/clips',result.projectSlug,result.segmentId));
        assert.equal(await hash(media.path),media.sha256);const id=randomUUID(),extension=key==='posterUrl'?'jpg':'mp4',filename=`${id}.${extension}`;
        await copyFile(media.path,path.join(uploads,filename),constants.COPYFILE_EXCL);
        data.media.push({id,filename,mime:extension==='jpg'?'image/jpeg':'video/mp4',size:media.bytes,createdAt:new Date().toISOString()});urls[key]=`/api/media/${id}`;
      }
      segment={...segment,id:targetId,name:result.timeline==='showcase'?result.kind==='trailer'?'Trailer do editor':'Comissão do editor':'Trecho no lançamento original',start:result.start,end:result.end,
        kind:result.kind,order:segment?.order??project.segments.length,rangeStatus:'explicit',timeline:result.timeline,sourceUrl:result.sourceUrl,evidence:result.evidence,
        videoWidth:result.presentation.width,videoHeight:result.presentation.height,previewStart:0,mediaFingerprint:fingerprint,...urls};
      if(project.slug==='indie-cross-chevz')segment.coEditors=['Akira'];
      project.segments=project.segments.filter(s=>s.id!==targetId&&s.id!==result.segmentId);project.segments.push(segment);
      // Local playback needs published references in the media API. No production status is changed.
      project.status='published';
    }
    const temporary=path.join(directory,`media-import-${randomUUID()}.tmp`);await writeFile(temporary,JSON.stringify(data,null,2),{flag:'wx',mode:0o600});await rename(temporary,file);
  }finally{await lock.close();await unlink(lockPath);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2),options={};
    for(let n=0;n<args.length;n++) {
      if(args[n]==='--execute')options.execute=true;
      else if(args[n]==='--import-local')options.importLocal=true;
      else if(args[n]==='--refresh-assets')options.refreshAssets=true;
      else {const key={'--plan':'planPath','--yt-dlp':'ytDlp','--ffmpeg':'ffmpeg','--ffprobe':'ffprobe'}[args[n]];assert.ok(key&&args[n+1]);options[key]=args[++n];}
    }
    const report=await acquire(options);console.log(JSON.stringify({mode:report.mode||'export',ready:report.results?.length,failures:report.failures,sources:report.sources,projects:report.projects}));
    if(report.failures?.length)process.exitCode=1;
  }catch(error){console.error(error.message);process.exitCode=1;}
}
