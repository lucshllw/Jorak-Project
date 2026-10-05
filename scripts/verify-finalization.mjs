import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {editingProducts,productRequest,productHref} from '../src/lib/editing-products.ts';
const base=process.env.JORAK_VERIFY_URL||'http://127.0.0.1:3001';
const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const catalog=JSON.parse(await readFile('data/catalog.json','utf8')).portfolio;
for(const product of editingProducts){
  const project=catalog.projects.find(p=>p.slug===product.portfolioSlug);
  assert.ok(project,'Associação cadastrada: '+product.id);
  assert.ok(normalize(project.character).includes(normalize(product.name)),'Personagem: '+product.id);
  assert.ok(project.artistIds.some(id=>normalize(catalog.artists.find(a=>a.id===id).name)===normalize(product.artist)),'Artista: '+product.id);
}
const products=await fetch(base+'/projetos-de-edicao');assert.equal(products.status,200);
const html=await products.text();
assert.equal([...html.matchAll(/<article[^>]*data-product="/g)].length,14);
assert.ok(html.includes('Baixar gratuitamente'));
assert.ok(html.includes(productHref(editingProducts[13])));
for(const product of editingProducts.filter(p=>p.price>0)){
  const response=await fetch(base+productHref(product));assert.equal(response.status,200);
  const contact=await response.text();assert.ok(contact.includes(productRequest(product)),'Solicitação dedicada: '+product.id);
}
const academy=await fetch(base+'/surface-academy');assert.equal(academy.status,200);
const content=await academy.text();assert.ok(content.includes('https://www.surfateacademy.com.br/'));assert.ok(content.includes('professor de animação 2D no celular'));
const unknown=await fetch(base+'/contato?produto=nao-existe');assert.ok((await unknown.text()).includes('Conte sua ideia.'));
const data=await (await fetch(base+'/api/portfolio')).json();
assert.equal(data.projects.length,25);
const ready=data.projects.filter(p=>p.segments.some(s=>s.clipUrl));
const previews=data.projects.filter(p=>p.segments.some(s=>s.previewUrl));
assert.equal(ready.length,25);assert.equal(previews.length,25);
const urls=[...new Set(ready.flatMap(p=>p.segments.flatMap(s=>[s.clipUrl,s.mobileClipUrl,s.previewUrl,s.posterUrl]).filter(Boolean)))];
for(let i=0;i<urls.length;i+=6)await Promise.all(urls.slice(i,i+6).map(async url=>{const response=await fetch(base+url,{method:'HEAD'});assert.equal(response.status,200,'Mídia local: '+url);}));
for(const slug of ['morte-branca-pejota','vinganca-mathover','arcanjo-caido-msdaiki']){assert.ok(html.includes('/media/covers/'+slug+'.jpg'));assert.ok(!data.projects.some(p=>p.slug===slug));assert.ok(!html.includes('href="/projeto/'+slug+'"'));}
const result={products:14,confirmedCoverAssociations:14,paidConsultations:13,freeDownloads:1,academy:'Surfate Academy',registeredProjects:57,publicProjects:25,nativeProjects:ready.length,previewProjects:previews.length,mediaUrlsAvailable:urls.length,archivedProjects:32,commercialThumbnailsPreserved:true};
await mkdir('.local-data/verification',{recursive:true});await writeFile('.local-data/verification/finalization-http.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
