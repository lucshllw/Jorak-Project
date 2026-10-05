import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('14 produtos preservam preço, artista e destinos distintos de consulta e download', async () => {
  assert.ok(existsSync(new URL('./editing-products.ts',import.meta.url)), 'Catálogo de produtos ainda não implementado');
  const {editingProducts, productHref, productRequest, NODE_VIDEO_COMPATIBILITY} = await import('./editing-products.ts');
  const expected=[['Kaiser','M4rkim',150],['Qin','Anirap',120],['Hugo','Kaito',100],['Kaiser','Fokes',100],['Acony','oShaman',90],['Hakari','Basara',80],['Valentine','Ranori',80],['Diego','Basara',80],['Simo Hayha','Pejota',75],['Uruma','Mathover',70],['Maki','Neshyzk',60],['Rin','Igris',55],['Estarossa','MSDaiki',50],['Cristino','Shiny',0]];
  assert.deepEqual(editingProducts.map(p=>[p.name,p.artist,p.price]),expected);
  assert.equal(new Set(editingProducts.map(p=>p.id)).size,14);
  assert.equal(NODE_VIDEO_COMPATIBILITY,'Projetos para Node Video. Funcionam somente em versões superiores à 6.70.');
  for (const product of editingProducts) {
    if(product.price===0) assert.equal(productHref(product),'https://drive.google.com/drive/folders/11BnE7c30TY2W_xLrhDDRtdmkME31lZMA');
    else {
      const url=new URL(productHref(product),'http://localhost');
      assert.equal(url.pathname,`/projetos-de-edicao/${product.id}/contato`); assert.equal(url.searchParams.has('produto'),false);
      assert.ok(productRequest(product).includes(`${product.name} — ${product.artist}`));
      assert.ok(productRequest(product).includes('superiores à 6.70'));
    }
  }
});

test('FAQ distingue arquivos Node Video, academia e orçamento de edição personalizada', async()=>{
  const {matchFaq}=await import('./faq.ts');
  assert.equal(matchFaq('Kaiser M4rkim para Node Video custa quanto?'),'products');
  assert.equal(matchFaq('Node Video 6.70 é compatível?'),'products');
  assert.equal(matchFaq('Conhecer a Surface Academy'),'academy');
  assert.equal(matchFaq('Qual o valor de uma edição personalizada?'),'budget');
});
