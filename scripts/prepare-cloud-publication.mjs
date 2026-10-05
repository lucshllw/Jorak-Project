// Storage upload uses the existing private server key; SQL is reviewed/applied through MCP.
// No application role gains extra table privileges. Existing rows are upserted, never deleted.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(await readFile('.local-data/deploy-env.json','utf8'));
assert.equal(new URL(env.SUPABASE_URL).hostname,'luhogjenhldwuimstpiq.supabase.co');
const data=JSON.parse(await readFile('.local-data/portfolio.json','utf8'));
const published=data.projects.filter(p=>p.status==='published'),refs=new Set();
const reference=url=>{if(url?.startsWith('/api/media/'))refs.add(url.split('/').at(-1));};
for(const p of published){reference(p.coverUrl);p.processImages.forEach(reference);for(const s of p.segments)for(const field of ['clipUrl','mobileClipUrl','previewUrl','posterUrl'])reference(s[field]);}
reference(data.settings.avatarUrl);reference(data.settings.showreelUrl);
const media=data.media.filter(m=>refs.has(m.id));assert.equal(media.length,refs.size,'Every public media URL has a registered file');
const bytes=media.reduce((sum,m)=>sum+m.size,0);assert.ok(bytes<950*1024*1024,'Remain within the existing free storage allowance');
assert.ok(media.every(m=>m.size<=104857600),'Bucket size limit');
await mkdir('.local-data/deploy',{recursive:true});
const q=value=>value===undefined||value===null?'null':typeof value==='boolean'||typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
const j=value=>q(JSON.stringify(value))+'::jsonb';
const sql=[];
for(const artist of data.artists)sql.push(`insert into public.portfolio_artists(id,name,slug) values(${q(artist.id)},${q(artist.name)},${q(artist.slug)}) on conflict(id) do update set name=excluded.name,slug=excluded.slug;`);
for(const project of data.projects){
  const {id,slug,status,featured,featuredOrder,order,artistIds,segments,...content}=project;
  sql.push(`insert into public.portfolio_projects(id,slug,status,featured,featured_order,sort_order,data) values(${q(id)},${q(slug)},${q(status)},${q(featured)},${q(featuredOrder)},${q(order)},${j(content)}) on conflict(id) do update set slug=excluded.slug,status=excluded.status,featured=excluded.featured,featured_order=excluded.featured_order,sort_order=excluded.sort_order,data=excluded.data,updated_at=now();`);
  artistIds.forEach((artistId,index)=>sql.push(`insert into public.portfolio_project_artists(project_id,artist_id,sort_order) values(${q(id)},${q(artistId)},${index}) on conflict(project_id,artist_id) do update set sort_order=excluded.sort_order;`));
  segments.forEach(segment=>sql.push(`insert into public.portfolio_segments(project_id,id,sort_order,start_seconds,end_seconds,data) values(${q(id)},${q(segment.id)},${q(segment.order)},${q(segment.start)},${q(segment.end)},${j(segment)}) on conflict(project_id,id) do update set sort_order=excluded.sort_order,start_seconds=excluded.start_seconds,end_seconds=excluded.end_seconds,data=excluded.data;`));
}
for(const m of media)sql.push(`insert into public.portfolio_media(id,filename,mime,byte_size,created_at) values(${q(m.id)},${q(m.filename)},${q(m.mime)},${q(m.size)},${q(m.createdAt)}) on conflict(id) do update set filename=excluded.filename,mime=excluded.mime,byte_size=excluded.byte_size;`);
sql.push(`insert into public.portfolio_settings(id,data) values('site',${j(data.settings)}) on conflict(id) do update set data=excluded.data;`);
const chunks=[];let chunk=[];let length=0;
for(const statement of sql){if(length+statement.length>35000&&chunk.length){chunks.push(chunk);chunk=[];length=0;}chunk.push(statement);length+=statement.length;}
if(chunk.length)chunks.push(chunk);
for(let index=0;index<chunks.length;index++)await writeFile(`.local-data/deploy/catalog-${index}.sql`,'begin;\n'+chunks[index].join('\n')+'\ncommit;\n');
await writeFile('.local-data/deploy/manifest.json',JSON.stringify({files:media.length,bytes,publicProjects:published.length,archivedProjects:data.projects.filter(p=>p.status==='archived').length,sqlChunks:chunks.length},null,2));
if(!process.argv.includes('--upload')){console.log(JSON.stringify({prepared:true,files:media.length,bytes,sqlChunks:chunks.length}));process.exit(0);}
const client=createClient(env.SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),bucket=client.storage.from('portfolio-media');
const {data:known,error:listError}=await bucket.list('',{limit:1000});if(listError)throw new Error('Storage list failed: '+listError.message);
const existing=new Map(known.map(item=>[item.name,item])),uploaded=[];
async function upload(m){
  if(existing.has(m.filename)){assert.equal(existing.get(m.filename).metadata.size,m.size,'Existing object must match size');uploaded.push(m.id);return;}
  const location='.local-data/uploads/'+m.filename;assert.equal((await stat(location)).size,m.size);
  const body=await readFile(location);const {error}=await bucket.upload(m.filename,body,{contentType:m.mime,cacheControl:'31536000',upsert:false});
  if(error)throw new Error('Storage upload failed '+m.id+': '+error.message);
  uploaded.push(m.id);await writeFile('.local-data/deploy/uploaded.json',JSON.stringify(uploaded));console.log(`Storage ${uploaded.length}/${media.length}`);
}
for(let index=0;index<media.length;index+=2)await Promise.all(media.slice(index,index+2).map(upload));
console.log(JSON.stringify({uploaded:uploaded.length,bytes,readyForCatalogImport:true}));
