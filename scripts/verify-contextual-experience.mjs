import assert from 'node:assert/strict';
import {readFile,writeFile,rename,open,unlink,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {editingProducts,productHref,productPrice} from '../src/lib/editing-products.ts';
import {editionPlaylist} from '../src/lib/project-presentation.ts';
import {youtubeId} from '../src/lib/media.ts';
const base=process.argv[2]||'http://127.0.0.1:3101';
assert.equal(new URL(base).hostname,'127.0.0.1');
const environment=await readFile('.env.local','utf8');assert.match(environment,/^PORTFOLIO_MODE=local\s*$/m);
const directory=path.resolve(/^PORTFOLIO_DATA_DIR=(.+)$/m.exec(environment)?.[1].trim()||'.local-data');
assert.ok(path.relative(process.cwd(),directory)&&!path.relative(process.cwd(),directory).startsWith('..'));
const dataPath=path.join(directory,'portfolio.json'),ids=[],checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
let ip=10;
async function post(endpoint,body,origin=base){
 return fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'x-forwarded-for':'198.51.100.'+(ip++)},body:JSON.stringify(body)});
}
try{
 const catalog=await (await fetch(base+'/api/portfolio')).json();
 for(const p of editingProducts.filter(p=>p.price>0)){
  const page=await fetch(base+productHref(p));check('Rota dedicada '+p.id,page.status===200);
  const html=await page.text();check('Preço fixo e campos essenciais '+p.id,html.includes(productPrice(p).replace(/\u00a0/g,'&nbsp;'))||html.includes(productPrice(p)));
  check('E-mail de compra pronto '+p.id,!/name="budget"/.test(html)&&!html.includes('<form')&&html.includes('Enviar e-mail sobre este projeto')&&html.includes('mailto:'));
 }
 check('Cristino grátis preservado',productHref(editingProducts.at(-1)).startsWith('https://drive.google.com/'));
 for(const id of ['nao-existe','cristino-shiny'])check('404 solicitação '+id,(await fetch(base+'/projetos-de-edicao/'+id+'/contato')).status===404);
 const general=await (await fetch(base+'/contato?produto=kaiser-fokes')).text();check('Contato geral preservado',general.includes('Conte sua ideia.')&&general.includes('name="budget"'));
 const input={name:'Teste de solicitação',email:'verification@example.com',message:'Mensagem de teste local para este arquivo.',website:''};
 for(const id of ['kaiser-m4rkim','kaiser-fokes']){
  const p=editingProducts.find(p=>p.id===id),response=await post('/api/product-interest',{...input,productId:id});check('Envio '+id,response.status===201);
  const result=await response.json();ids.push(result.id);
  const saved=JSON.parse(await readFile(dataPath,'utf8')).inquiries.find(item=>item.id===result.id);
  check('Registro canônico '+id,saved.productId===id&&saved.productPrice===p.price&&saved.budget===productPrice(p)&&saved.message.includes(p.artist));
 }
 check('Preço adulterado recusado',(await post('/api/product-interest',{...input,productId:'kaiser-fokes',price:1})).status===400);
 check('Origem externa recusada',(await post('/api/product-interest',{...input,productId:'kaiser-fokes'},'https://external.example')).status===403);
 check('Projeto gratuito sem solicitação paga',(await post('/api/product-interest',{...input,productId:'cristino-shiny'})).status===404);
 check('Projeto inválido recusado',(await post('/api/product-interest',{...input,productId:'invalido'})).status===404);
 check('Honeypot preservado',(await post('/api/product-interest',{...input,productId:'kaiser-fokes',website:'spam.example'})).status===400);
 for(const context of [{page:'home'},{page:'index'},{page:'about'},{page:'products'},{page:'academy'},{page:'contact'},{page:'product-contact',productId:'kaiser-fokes'}]){
  const q=context.page==='product-contact'?'Qual projeto e preço selecionei?':context.page==='academy'?'Qual é o site oficial?':context.page==='index'?'Como buscar um trabalho?':context.page==='contact'?'Como preencher o formulário?':'Quais trabalhos estão disponíveis?';
  const response=await post('/api/faq',{question:q,context});check('FAQ contexto '+context.page,response.status===200);
  const result=await response.json();check('Resposta registrada '+context.page,result.mode==='registered'&&result.answer.length>20);
  if(context.page==='product-contact')check('FAQ Kaiser certo',result.answer.includes('Fokes')&&result.answer.includes('100')&&!result.answer.includes('150'));
 }
 check('FAQ rejeita campos privados',(await post('/api/faq',{question:'Como pedir?',context:{page:'contact',email:'private@example.com'}})).status===400);
 const tailored=[];
 for(const question of ['Qual projeto e preço selecionei?','Qual é a compatibilidade?','Como enviar meu interesse?']){const response=await post('/api/faq',{question,context:{page:'product-contact',productId:'kaiser-fokes'}});check('Comando FAQ '+question,response.status===200);tailored.push((await response.json()).answer);}
 check('Respostas específicas distintas',new Set(tailored).size===3);
 const follow=await post('/api/faq',{question:'Pode explicar melhor?',context:{page:'product-contact',productId:'kaiser-fokes'},previousQuestions:['Qual é a compatibilidade?']});check('Acompanhamento conserva compatibilidade',(await follow.json()).answer.includes('6.70'));
 check('Histórico excessivo recusado',(await post('/api/faq',{question:'Como buscar?',previousQuestions:Array(7).fill('Quais trabalhos?')})).status===400);
 const native=catalog.projects.filter(p=>editionPlaylist(p).length);
 const embed=catalog.projects.filter(p=>!editionPlaylist(p).length&&youtubeId(p.youtubeUrl)&&!['unavailable','members-only'].includes(p.videoAvailability||''));
 const result={passed:checks.length,checks,paidRoutes:13,faqContexts:7,totalProjects:catalog.projects.length,nativeEndingCandidates:native.length,originalEmbedCandidates:embed.length,externalOnly:catalog.projects.length-native.length-embed.length,coverOrigins:Object.fromEntries(['spotify','youtube','official','uploaded',null].map(source=>[String(source),catalog.projects.filter(p=>p.coverSource===source).length])),fixturesRemoved:true};
 await mkdir('.local-data/verification',{recursive:true});await writeFile('.local-data/verification/contextual-http.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{
 if(ids.length){const lockPath=path.join(directory,'.write-lock');let lock;
  for(let n=0;n<100;n++){try{lock=await open(lockPath,'wx');break;}catch(error){if(error.code!=='EEXIST')throw error;await new Promise(r=>setTimeout(r,40));}}
  assert.ok(lock);
  try{const data=JSON.parse(await readFile(dataPath,'utf8'));data.inquiries=data.inquiries.filter(item=>!ids.includes(item.id));const temp=path.join(directory,'verification.'+randomUUID()+'.tmp');await writeFile(temp,JSON.stringify(data,null,2));await rename(temp,dataPath);}
  finally{await lock.close();await unlink(lockPath);}
 }
}
