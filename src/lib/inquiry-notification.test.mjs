import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { productInquiry, findProduct } from './editing-products.ts';

const inquiry={id:'test-id',name:'Cliente de teste',email:'visitor@example.com',type:'Motion design',duration:'30 segundos',deadline:'Novembro',references:'https://example.com',budget:'R$ 500',message:'Quero uma edição com movimento.',status:'new',createdAt:'2026-10-05T12:00:00Z'};
const config={recipient:'jorak@example.com',origin:'https://portfolio.example.com'};
async function module(){assert.ok(existsSync(new URL('./inquiry-notification.ts',import.meta.url)),'Envio de avisos ainda não implementado');return import('./inquiry-notification.ts');}

test('aviso de orçamento usa destinatário fixo e inclui briefing e contato para resposta',async()=>{
  const {sendInquiryNotification}=await module();let sent;
  const result=await sendInquiryNotification(inquiry,config,async(url,options)=>{sent={url,options,body:JSON.parse(options.body)};return Response.json({success:'true',message:'Success'});});
  assert.equal(result,'submitted');assert.equal(sent.url,'https://formsubmit.co/ajax/jorak%40example.com');
  assert.equal(sent.body._replyto,inquiry.email);assert.equal(sent.body.email,inquiry.email);
  assert.equal(sent.body['Mensagem'],inquiry.message);assert.equal(sent.body['Orçamento'],inquiry.budget);
  assert.equal(sent.body._url,config.origin+'/contato');assert.match(sent.body._subject,/Orçamento/);
  assert.equal(sent.options.headers.Referer,config.origin+'/contato');
  assert.equal(sent.options.redirect,'error');assert.ok(sent.options.signal);
  assert.equal('_captcha' in sent.body,false);assert.equal('_autoresponse' in sent.body,false);
});

test('interesse em produto envia projeto e preço canônicos com assunto próprio',async()=>{
  const {sendInquiryNotification}=await module();let body;
  const result=await sendInquiryNotification({...inquiry,...productInquiry(findProduct('kaiser-m4rkim'),inquiry)},config,async(_,options)=>{body=JSON.parse(options.body);return Response.json({success:true});});
  assert.equal(result,'submitted');assert.match(body._subject,/Arquivo de projeto/);assert.match(body.Mensagem,/Kaiser — M4rkim/);assert.match(body.Mensagem,/150/);
  assert.equal(body._url,config.origin+'/projetos-de-edicao/kaiser-m4rkim/contato');
});

test('falha, rejeição, resposta inválida e timeout não viram confirmação de envio',async()=>{
  const {sendInquiryNotification}=await module();
  for(const fetcher of [async()=>Response.json({success:false}),async()=>new Response('Bad gateway',{status:502}),async()=>new Response('not JSON'),async()=>{throw new DOMException('Timeout','TimeoutError');}])assert.equal(await sendInquiryNotification(inquiry,config,fetcher),'unavailable');
});

test('ativação pendente é distinguida de entrega e configuração inválida não faz requisição',async()=>{
  const {sendInquiryNotification}=await module();
  assert.equal(await sendInquiryNotification(inquiry,config,async()=>Response.json({success:false,message:'Form should be activated'})),'activation-required');
  for(const invalid of [{...config,recipient:'bad\naddress'},{...config,origin:'http://portfolio.example.com'}]){
    assert.equal(await sendInquiryNotification(inquiry,invalid,async()=>{assert.fail('Não enviar com configuração inválida');}),'unavailable');
  }
});

test('diagnóstico informa a categoria de falha sem conteúdo do cliente',async()=>{
  const {sendInquiryNotification}=await module();let reason;
  await sendInquiryNotification(inquiry,{...config,onFailure:value=>{reason=value;}},async()=>new Response('Denied',{status:403}));
  assert.equal(reason,'http-403');
});
