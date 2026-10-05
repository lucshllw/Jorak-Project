import test from 'node:test';
import assert from 'node:assert/strict';
import { isHomeEntry } from './introduction.ts';
import { editionPlaylist, coverTextureFrame, projectDescription } from './project-presentation.ts';
import { matchFaq, faqAnswer } from './faq.ts';

test('intro appears on home entry, refresh and return without depending on navigation type', () => {
  for(const type of ['navigate','reload','back_forward']) assert.equal(isHomeEntry({type,name:'http://localhost/?disco=faminto'}),true);
  for(const entry of [undefined,{type:'reload',name:'http://localhost/sobre'},{type:'navigate',name:'invalid'}]) assert.equal(isHomeEntry(entry),false);
});
test('one edition playlist prefers original cuts without duplicate commissions or inferred media', () => {
  const part=(id,start,end,timeline='original',rangeStatus='explicit')=>({id,start,end,timeline,rangeStatus,clipUrl:'/api/media/'+id,order:0});
  const original=part('original',241,270),showcase=part('showcase',0,36,'showcase');
  assert.deepEqual(editionPlaylist({segments:[showcase,original]}),[original]);
  const late=part('late',300,310),early=part('early',40,60),guessed=part('guessed',1,20,'original','inferred');
  assert.deepEqual(editionPlaylist({segments:[late,early,guessed]}),[early,late]);
  assert.deepEqual(editionPlaylist({segments:[showcase,part('alt',0,40,'showcase')]}),[showcase]);
  assert.deepEqual(editionPlaylist({segments:[guessed]}),[]);
});
test('circular covers preserve source aspect and use CSS-compatible focal coordinates', () => {
  assert.deepEqual(coverTextureFrame(1280,720),{repeatX:.5625,repeatY:1,offsetX:.21875,offsetY:0});
  assert.equal(coverTextureFrame(1280,720,{x:100,y:50}).offsetX,.4375);
  assert.equal(coverTextureFrame(720,1280,{x:50,y:0}).offsetY,.4375);
  assert.deepEqual(coverTextureFrame(640,640),{repeatX:1,repeatY:1,offsetX:0,offsetY:0});
});
test('public descriptions omit unknown universes and never expose audit uncertainty', () => {
  const text=projectDescription({title:'Carrasco',character:'Noir',work:''},'Ranori');
  assert.match(text,/Sou Jorak/);assert.match(text,/Noir/);assert.doesNotMatch(text,/universo de|pendente|confirmar|inferido/);
});
test('registered FAQ does not promise prices, deadlines or unsupported answers', () => {
  const data={projects:[{}],artists:[{name:'AniRap'}]};
  assert.equal(matchFaq('Quanto custa uma edição?'),'budget');
  assert.equal(matchFaq('Está disponível para amanhã?'),'deadline');
  assert.equal(matchFaq('Qual é a senha do administrador?'),'unknown');
  assert.match(faqAnswer('budget',data).answer,/Não há uma tabela/);
  assert.match(faqAnswer('deadline',data).answer,/combinados diretamente/);
  assert.equal(faqAnswer('contact',data).href,'/contato');
});
