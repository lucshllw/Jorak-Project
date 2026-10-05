import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
const plan=JSON.parse(await readFile('data/client-confirmed-media.json','utf8'));
const ffmpeg=process.env.FFMPEG_PATH;if(!ffmpeg)throw new Error('Set FFMPEG_PATH');
const directory='.local-data/verification/client-frames';await mkdir(directory,{recursive:true});
const tiles=[],report=[];
for(let index=0;index<plan.sources.length;index++){
  const source=plan.sources[index],clip=JSON.parse(await readFile(`.local-data/clips/${source.projectSlug}/${source.segmentId}/export.json`,'utf8'));
  for(const [edge,offset] of [['start',0],['end',clip.presentation.duration-.1]]){
    for(const [version,input,time] of [['original',clip.original.path,source.start+offset],['clip',clip.presentation.path,offset]]){
      const output=`${directory}/${source.projectSlug}-${edge}-${version}.png`;
      const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-y','-ss',String(time),'-i',input,'-frames:v','1','-vf','scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2','-threads','2',output],{windowsHide:true,encoding:'utf8'});
      if(result.status!==0)throw new Error(result.stderr);
      const column=(edge==='start'?0:2)+(version==='clip'?1:0);
      tiles.push({input:output,left:column*480,top:index*270});
    }
  }
  report.push({slug:source.projectSlug,start:source.start,end:source.end,duration:clip.presentation.duration,audio:clip.presentation.audioCodec,previewAudio:clip.preview.audioStream,evidence:'Intervalo informado pelo cliente'});
}
await sharp({create:{width:1920,height:810,channels:3,background:'#07100d'}}).composite(tiles).png().toFile(directory+'/comparison.png');
await writeFile(directory+'/report.json',JSON.stringify({columns:['original start','clip start','original end','clip end'],rows:report},null,2));console.log(JSON.stringify(report));
