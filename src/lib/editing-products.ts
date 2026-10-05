export const NODE_VIDEO_COMPATIBILITY = 'Projetos para Node Video. Funcionam somente em versões superiores à 6.70.';
export const ACADEMY_URL = 'https://www.surfateacademy.com.br/';
export type EditingProduct = { id: string; name: string; artist: string; price: number; portfolioSlug: string; downloadUrl?: string };
// Prices and associations supplied by Jorak's briefing. No paid product has a download URL.
export const editingProducts: EditingProduct[] = [
  { id:'kaiser-m4rkim',name:'Kaiser',artist:'M4rkim',price:150,portfolioSlug:'imperador-m4rkim' },
  { id:'qin-anirap',name:'Qin',artist:'Anirap',price:120,portfolioSlug:'o-primeiro-rei-anirap' },
  { id:'hugo-kaito',name:'Hugo',artist:'Kaito',price:100,portfolioSlug:'mensageiro-kaito' },
  { id:'kaiser-fokes',name:'Kaiser',artist:'Fokes',price:100,portfolioSlug:'de-joelhos-fokes' },
  { id:'acony-oshaman',name:'Acony',artist:'oShaman',price:90,portfolioSlug:'convidado-especial-oshaman' },
  { id:'hakari-basara',name:'Hakari',artist:'Basara',price:80,portfolioSlug:'cara-de-sorte-basara' },
  { id:'valentine-ranori',name:'Valentine',artist:'Ranori',price:80,portfolioSlug:'america-ranori' },
  { id:'diego-basara',name:'Diego',artist:'Basara',price:80,portfolioSlug:'karma-basara' },
  { id:'simo-hayha-pejota',name:'Simo Hayha',artist:'Pejota',price:75,portfolioSlug:'morte-branca-pejota' },
  { id:'uruma-mathover',name:'Uruma',artist:'Mathover',price:70,portfolioSlug:'vinganca-mathover' },
  { id:'maki-neshyzk',name:'Maki',artist:'Neshyzk',price:60,portfolioSlug:'restricao-neshyzk' },
  { id:'rin-igris',name:'Rin',artist:'Igris',price:55,portfolioSlug:'traicao-de-sangue-igris' },
  { id:'estarossa-msdaiki',name:'Estarossa',artist:'MSDaiki',price:50,portfolioSlug:'arcanjo-caido-msdaiki' },
  { id:'cristino-shiny',name:'Cristino',artist:'Shiny',price:0,portfolioSlug:'lampiao-de-espinhos-shiny',downloadUrl:'https://drive.google.com/drive/folders/11BnE7c30TY2W_xLrhDDRtdmkME31lZMA' },
];
export function findProduct(id?: string) { return editingProducts.find(product=>product.id===id); }
export function productPrice(product: EditingProduct) { return product.price===0?'Gratuito':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(product.price); }
export function productHref(product: EditingProduct) { return product.price===0 && product.downloadUrl ? product.downloadUrl : `/projetos-de-edicao/${encodeURIComponent(product.id)}/contato`; }
export function productDescription(product: EditingProduct) { return `Arquivo de projeto da edição de ${product.name}, de ${product.artist}, para abrir e explorar no Node Video. Compatível somente com versões superiores à 6.70.`; }
export function productRequest(product: EditingProduct) { return `Tenho interesse no arquivo de projeto ${product.name} — ${product.artist}, anunciado por ${productPrice(product)}. ${NODE_VIDEO_COMPATIBILITY} Gostaria de consultar como adquirir este projeto.`; }
export function productEmailHref(product: EditingProduct, email: string) {
  const subject=`Interesse em ${product.name} — ${product.artist} | JORAK`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(productRequest(product))}`;
}
export function productInquiry(product: EditingProduct, input: {name:string;email:string;message:string}) {
  if(product.price<=0) throw new Error('O projeto gratuito não recebe solicitações pagas.');
  return {name:input.name,email:input.email,type:'Arquivo de projeto / Node Video',duration:'',deadline:'',references:'',budget:productPrice(product),message:`Projeto: ${product.name} — ${product.artist}\nPreço fixo: ${productPrice(product)}\n${NODE_VIDEO_COMPATIBILITY}\n\n${input.message}`,productId:product.id,productPrice:product.price};
}
