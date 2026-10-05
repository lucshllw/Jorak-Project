// Offline owner maintenance. Retains all researched records and creates a private backup.
import { readFile, writeFile, copyFile, mkdir, stat, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { selectPublicProjects, hasPlayableContribution } from '../src/lib/public-selection.ts';
const file = '.local-data/portfolio.json';
const data = JSON.parse(await readFile(file,'utf8'));
const missing = [];
for (const project of data.projects) for (const segment of project.segments) if (segment.clipUrl?.startsWith('/api/media/')) {
  const id = segment.clipUrl.split('/').at(-1), media = data.media.find(item=>item.id===id);
  if (!media || !(await stat('.local-data/uploads/'+media.filename).catch(()=>null))) missing.push(project.slug);
}
if(missing.length) throw new Error('Missing media: '+missing.join(', '));
if(process.argv.includes('--apply')) {
  await copyFile(file,`.local-data/finalization-backup-${randomUUID()}.json`);
  for(const project of data.projects) {
    if(!hasPlayableContribution(project)) project.status='archived';
    else if(project.status!=='archived') project.status='published';
  }
  const temporary = file+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(data,null,2),{mode:0o600}); await rename(temporary,file);
}
const projects=selectPublicProjects(data.projects);
const report={registered:data.projects.length,published:projects.length,archived:data.projects.filter(p=>p.status==='archived').length,featured:projects.filter(p=>p.featured).length,slugs:projects.map(p=>p.slug)};
await mkdir('.local-data/verification',{recursive:true});await writeFile('.local-data/verification/public-selection.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
