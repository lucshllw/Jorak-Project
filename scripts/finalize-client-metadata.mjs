import {readFile,writeFile,copyFile,mkdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import sharp from 'sharp';
const attachment=process.argv[2];if(!attachment)throw new Error('Informe a capa fornecida pelo cliente.');
const bytes=await readFile(attachment),sha256=createHash('sha256').update(bytes).digest('hex');
await mkdir('.local-data/artwork/originals',{recursive:true});await copyFile(attachment,'.local-data/artwork/originals/sou-deus-cliente.png');
await sharp(bytes).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile('public/media/covers/sou-deus-7-minutoz.jpg');
await sharp(bytes).webp({quality:90,effort:5}).toFile('public/media/covers/sou-deus-7-minutoz.webp');
const plan=JSON.parse(await readFile('data/client-confirmed-media.json','utf8'));
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
const localText=await readFile('.local-data/portfolio.json','utf8'),local=JSON.parse(localText);
for(const source of plan.sources){
  const researched=catalog.portfolio.projects.find(p=>p.slug===source.projectSlug),live=local.projects.find(p=>p.slug===source.projectSlug),audit=catalog.provenance.find(p=>p.slug===source.projectSlug);
  const confirmed={id:source.segmentId,name:'Trecho no lançamento original',start:source.start,end:source.end,kind:'edit',order:researched.segments.length,clipUrl:null,previewUrl:null,rangeStatus:'explicit',timeline:'original',sourceUrl:source.originalUrl,evidence:'Intervalo informado pelo cliente'};
  if(!researched.segments.some(s=>s.id===confirmed.id))researched.segments.push(confirmed);
  researched.verification=live.verification='Intervalo informado pelo cliente. Identidade do vídeo, título e artista conferidos no lançamento original.';
  audit.clientConfirmedRanges=[{start:source.start,end:source.end,source:'Intervalo informado pelo cliente'}];
  if(source.projectSlug==='sou-deus-7-minutoz'){
    audit.rangeDiscrepancy='A descrição marca Jorak em 2:28 e o próximo editor em 2:36. O limite 2:38 foi solicitado pelo cliente e preservado, sem atribuí-lo à descrição.';
    for(const p of [researched,live]){p.coverSource='uploaded';delete p.coverSourceUrl;p.coverAlt='Capa de SOU DEUS fornecida pelo cliente';p.coverCredit='Imagem fornecida pelo cliente como referência da capa no Spotify. Arquivo de 300 × 300 pixels, sem ampliação.';}
    live.coverUrl='/media/covers/sou-deus-7-minutoz.webp';
    delete audit.coverSourceUrl;audit.coverWidth=300;audit.coverHeight=300;audit.coverUpload={source:'Imagem fornecida pelo cliente',filename:'sou-deus-cliente.png',sha256};
  }
}
await writeFile('.local-data/client-metadata-backup-'+randomUUID()+'.json',localText,{flag:'wx',mode:0o600});
await writeFile('data/catalog.json',JSON.stringify(catalog,null,2)+'\n');
const temporary='.local-data/portfolio-'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(local,null,2),{flag:'wx',mode:0o600});await rename(temporary,'.local-data/portfolio.json');
console.log('Três intervalos e procedência da capa registrados; dados anteriores preservados.');
