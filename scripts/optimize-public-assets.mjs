// Preserve originals and audit data; publish lighter derivatives, never replace sources.
import {readFile,writeFile,stat,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
const root=process.cwd(),directory=path.join(root,'.local-data'),file=path.join(directory,'portfolio.json');
const original=await readFile(file,'utf8'),data=JSON.parse(original);
const ffmpeg=process.env.FFMPEG_PATH,ffprobe=process.env.FFPROBE_PATH;
if(!ffmpeg||!ffprobe)throw new Error('Set the installed FFmpeg and FFprobe paths.');
const run=(command,args)=>{const result=spawnSync(command,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stderr);return result.stdout;};
const ready=data.projects.filter(p=>p.status==='published'),changes=[],clips=new Map();
await mkdir(path.join(directory,'verification'),{recursive:true});
for(const project of ready){
  if(project.coverUrl?.startsWith('/media/covers/')&&project.coverUrl.endsWith('.jpg')){
    const input=path.join(root,'public',project.coverUrl),url=project.coverUrl.replace(/\.jpg$/,'.webp'),output=path.join(root,'public',url);
    await sharp(input).resize({width:640,height:640,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:5}).toFile(output);
    changes.push({kind:'cover',slug:project.slug,before:(await stat(input)).size,after:(await stat(output)).size});project.coverUrl=url;
  }
  for(const segment of project.segments){
    if(!segment.clipUrl?.startsWith('/api/media/'))continue;
    const oldId=segment.clipUrl.split('/').at(-1),source=data.media.find(m=>m.id===oldId);
    if(!source)throw new Error('Missing registered clip '+oldId);
    if(clips.has(oldId)){segment.clipUrl=clips.get(oldId);continue;}
    const input=path.join(directory,'uploads',source.filename);
    const details=JSON.parse(run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',input]));
    const video=details.streams.find(s=>s.codec_type==='video');
    const id=randomUUID(),filename=id+'.mp4',output=path.join(directory,'uploads',filename);
    const args=['-hide_banner','-loglevel','error','-nostdin','-n','-i',input,'-map','0:v:0','-map','0:a:0?'];
    if(video.width>1920||video.height>1080)args.push('-vf',"scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2");
    args.push('-c:v','libx264','-preset','fast','-crf','23','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',output);
    run(ffmpeg,args);
    const size=(await stat(output)).size;
    const after=JSON.parse(run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',output]));
    if(Math.abs(Number(after.format.duration)-Number(details.format.duration))>.15)throw new Error('Duration mismatch '+project.slug);
    if(Boolean(after.streams.find(s=>s.codec_type==='audio'))!==Boolean(details.streams.find(s=>s.codec_type==='audio')))throw new Error('Audio mismatch '+project.slug);
    if(size<source.size){data.media.push({id,filename,mime:'video/mp4',size,createdAt:new Date().toISOString()});segment.clipUrl='/api/media/'+id;}
    clips.set(oldId,segment.clipUrl);
    changes.push({kind:'clip',slug:project.slug,segment:segment.id,before:source.size,after:Math.min(size,source.size),audio:'copied',sourceId:oldId,publishedId:segment.clipUrl.split('/').at(-1)});
    console.log('Optimized '+project.slug+' '+Math.round(Math.min(size,source.size)/1024/1024)+' MiB');
  }
}
await writeFile(path.join(directory,'asset-backup-'+randomUUID()+'.json'),original,{flag:'wx',mode:0o600});
const temporary=file+'.'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(data,null,2),{flag:'wx',mode:0o600});await rename(temporary,file);
const report={changes,totals:Object.fromEntries(['cover','clip'].map(kind=>[kind,{before:changes.filter(x=>x.kind===kind).reduce((sum,x)=>sum+x.before,0),after:changes.filter(x=>x.kind===kind).reduce((sum,x)=>sum+x.after,0)}]))};
await writeFile(path.join(directory,'verification','asset-optimization.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.totals));
