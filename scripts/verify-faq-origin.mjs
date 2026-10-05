import assert from 'node:assert/strict';
const base=process.env.JORAK_VERIFY_URL||'http://127.0.0.1:3001';
const questions=[
  ['home','Como explorar os discos?'],
  ['index','Quantos trabalhos estão disponíveis?'],
  ['index','Como filtrar por artista?'],
  ['index','Como buscar um trabalho?'],
];
for(const [page,question] of questions){
  const response=await fetch(base+'/api/faq',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({question,context:{page},previousQuestions:[]})});
  assert.equal(response.status,200,`FAQ ${page}: ${question}`);
  assert.match(response.headers.get('content-type')||'',/application\/json/);
  const body=await response.json();
  assert.ok(body.answer?.length>20,`Resposta ausente: ${question}`);
  if(page==='home'){assert.match(body.answer,/Arraste os discos/);assert.equal(body.href,'/?visao=todos');}
  console.log(`Resposta confirmada: ${page} — ${question}`);
}
const question=questions[0][1];
for(const [origin,status] of [[base,200],['https://externo.example',403],[null,403]]){
  const response=await fetch(base+'/api/faq',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({question,context:{page:'home'}})});
  const body=await response.json();
  assert.equal(response.status,status,`FAQ com Origin ${origin}: ${JSON.stringify(body)}`);
  if(status===200){assert.match(body.answer,/Arraste os discos/);assert.equal(body.href,'/?visao=todos');}
}
console.log('FAQ da home e do índice responde no endereço atual e recusa solicitações externas ou sem origem.');
