import test from 'node:test';
import assert from 'node:assert/strict';
import { editingProducts, productHref, productInquiry } from './editing-products.ts';
import { faqContext, contextualFaqAnswer, contextualSuggestions } from './faq-context.ts';
import { endingTransition, coverPlatform } from './playback-ending.ts';
const data={projects:[{}],artists:[{name:'AniRap'}]};

test('paid requests have distinct direct routes and canonical server values',()=>{
  for(const p of editingProducts.filter(p=>p.price>0)){
    assert.equal(productHref(p),`/projetos-de-edicao/${p.id}/contato`);
    const request=productInquiry(p,{name:'Teste',email:'test@example.com',message:'Tenho interesse neste arquivo.'});
    assert.equal(request.productId,p.id);assert.equal(request.productPrice,p.price);
    assert.match(request.message,new RegExp(p.artist));assert.match(request.budget,/R\$/);
  }
  assert.throws(()=>productInquiry(editingProducts.at(-1),{}));
});
test('public FAQ contexts whitelist page and canonical paid product',()=>{
  assert.deepEqual(faqContext('index'),{page:'index'});
  assert.deepEqual(faqContext('product-contact','kaiser-fokes'),{page:'product-contact',productId:'kaiser-fokes'});
  assert.deepEqual(faqContext('product-contact','cristino-shiny'),{page:'contact'});
  assert.deepEqual(faqContext('invented'),{page:'home'});
  assert.notDeepEqual(contextualSuggestions({page:'index'}),contextualSuggestions({page:'academy'}));
  const answer=contextualFaqAnswer('budget',data,{page:'product-contact',productId:'kaiser-fokes'});
  assert.match(answer.answer,/Fokes/);assert.match(answer.answer,/100/);assert.doesNotMatch(answer.answer,/150/);
  assert.match(contextualFaqAnswer('unknown',data,{page:'contact'}).answer,/formulário/);
});
test('ending distinguishes cover origin from playback and suppresses loops/duplicate events',()=>{
  assert.equal(coverPlatform('spotify'),'spotify');assert.equal(coverPlatform('uploaded'),'jorak');
  assert.equal(endingTransition('playing','ended',true),'playing');
  assert.equal(endingTransition('ready','ended'),'ready');
  assert.equal(endingTransition('playing','ended'),'finishing');
  assert.equal(endingTransition('finishing','ended'),'finishing');
  assert.equal(endingTransition('finishing','present'),'celestial');
  assert.equal(endingTransition('celestial','repeat'),'returning');
  assert.equal(endingTransition('returning','repeat'),'returning');
  assert.equal(endingTransition('returning','play'),'playing');
});

import { answerFaqQuestion } from './faq-conversation.ts';

test('FAQ answers the specific command instead of repeating its broad topic',()=>{
  const context={page:'product-contact',productId:'kaiser-fokes'};
  const cost=answerFaqQuestion('Qual projeto e preço selecionei?',data,context);
  const compatibility=answerFaqQuestion('Qual é a compatibilidade?',data,context);
  const send=answerFaqQuestion('Como enviar meu interesse?',data,context);
  assert.match(cost.answer,/100/);assert.doesNotMatch(cost.answer,/150/);
  assert.match(compatibility.answer,/superiores à 6.70/);
  assert.match(send.answer,/aplicativo de e-mail/);assert.match(send.answer,/Enviar/);
  assert.equal(new Set([cost.answer,compatibility.answer,send.answer]).size,3);
  const index={page:'index'};
  assert.notEqual(answerFaqQuestion('Como buscar um trabalho?',data,index).answer,answerFaqQuestion('Como filtrar por artista?',data,index).answer);
  assert.notEqual(answerFaqQuestion('Qual é o site oficial?',data,{page:'academy'}).answer,answerFaqQuestion('Qual a relação do Jorak com a academia?',data,{page:'academy'}).answer);
});

test('FAQ follow-ups use only recent questions; factual price stays canonical',()=>{
  const context={page:'product-contact',productId:'kaiser-fokes'};
  const first=answerFaqQuestion('Qual preço?',data,context);
  const repeated=answerFaqQuestion('Qual preço?',data,context,['Qual preço?']);
  assert.notEqual(first.answer,repeated.answer);assert.match(repeated.answer,/100/);
  assert.match(answerFaqQuestion('E a versão?',data,context,['Qual preço?']).answer,/6.70/);
  assert.match(answerFaqQuestion('Pode explicar melhor?',data,context,['Qual é a compatibilidade?']).answer,/6.70/);
  assert.doesNotMatch(answerFaqQuestion('inventar licença vitalícia',data,context).answer,/licença vitalícia/i);
});

import {endingLinks} from './playback-ending.ts';
test('ending back links keep own showcase even with Spotify artwork and reject unsafe links',()=>{
  const links=endingLinks({youtubeUrl:'https://www.youtube.com/watch?v=original',spotifyUrl:'https://open.spotify.com/track/music',editShowcaseUrl:'https://www.youtube.com/watch?v=jorak',segments:[]});
  assert.equal(links.length,3);assert.match(links[0].label,/canal do Jorak/);
  assert.equal(endingLinks({youtubeUrl:'javascript:alert(1)',spotifyUrl:null,segments:[]}).length,0);
  assert.equal(endingLinks({youtubeUrl:'https://www.youtube.com/watch?v=jorak',spotifyUrl:null,editShowcaseUrl:'https://www.youtube.com/watch?v=jorak',segments:[]}).length,1);
});
