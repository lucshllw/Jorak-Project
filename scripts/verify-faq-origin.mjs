import assert from 'node:assert/strict';
const base=process.env.JORAK_VERIFY_URL||'http://127.0.0.1:3001';
const question='Como explorar os discos?';
for(const [origin,status] of [[base,200],['https://externo.example',403],[null,403]]){
  const response=await fetch(base+'/api/faq',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({question,context:{page:'home'}})});
  const body=await response.json();
  assert.equal(response.status,status,`FAQ com Origin ${origin}: ${JSON.stringify(body)}`);
  if(status===200){assert.match(body.answer,/Arraste os discos/);assert.equal(body.href,'/?visao=todos');}
}
console.log('FAQ responde no endereço atual e recusa solicitações externas ou sem origem.');
