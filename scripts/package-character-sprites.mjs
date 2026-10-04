// Packages imagegen's already transparent cutouts into consistent presentation canvases.
// This performs extraction, alpha normalization and sizing; no original is overwritten.
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const [atlas,smile]=process.argv.slice(2);
if(!atlas||!smile) throw new Error('Usage: node scripts/package-character-sprites.mjs <transparent-atlas.png> <transparent-smile.png>');
const dest=path.resolve('public/media/character/poses'); await mkdir(dest,{recursive:true});
const frames=[['point-side',0,0,384,512],['point-up',384,0,384,512],['seated',768,0,384,512],['seated-blink',1152,0,384,512],['falling',0,560,420,464],['landing',420,560,395,464],['leaning',815,512,337,512]];
async function packageImage(name,pipeline){
  const {data,info}=await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let offset=3;offset<data.length;offset+=4){if(data[offset]<12){data[offset]=0;data[offset-3]=data[offset-2]=data[offset-1]=0;}else if(data[offset]>249)data[offset]=255;}
  const png=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
  const trimmed=await sharp(png).trim({threshold:1}).toBuffer();
  const body=await sharp(trimmed).resize({width:336,height:480,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const size=await sharp(body).metadata();
  await sharp({create:{width:384,height:512,channels:4,background:'#00000000'}}).composite([{input:body,left:Math.round((384-size.width)/2),top:500-size.height}]).png({compressionLevel:9}).toFile(path.join(dest,name+'.png'));
}
// Seated blink is aligned to the same atlas cell, with an unchanged body rendered at runtime.
for(const [name,left,top,width,height] of frames){
  if(name==='seated'||name==='seated-blink'){
    const {data,info}=await sharp(atlas).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let i=3;i<data.length;i+=4){if(data[i]<12){data[i]=0;data[i-3]=data[i-2]=data[i-1]=0;}else if(data[i]>249)data[i]=255;}
    await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toFile(path.join(dest,name+'.png'));
  }else await packageImage(name,sharp(atlas).extract({left,top,width,height}));
}
await packageImage('smile',sharp(smile));
await writeFile(path.join(dest,'source.txt'),'Transparent cutouts prepared with imagegen from the six user-supplied Jorak references. Packaged by scripts/package-character-sprites.mjs. Canvas 384×512.\n');
console.log('Packaged 8 transparent character PNGs, 384×512.');
