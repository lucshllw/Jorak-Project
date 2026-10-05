import {findProduct,productHref,productPrice,NODE_VIDEO_COMPATIBILITY,ACADEMY_URL} from './editing-products.ts';
import {faqAnswer,type FaqTopic} from './faq.ts';
import type {PortfolioData} from './types';
export const faqPages=['home','index','about','products','academy','contact','product-contact'] as const;
export type FaqPage=typeof faqPages[number];
export type FaqContext={page:FaqPage;productId?:string};
export function faqContext(page:string,productId?:string):FaqContext {
  if(!faqPages.includes(page as FaqPage))return {page:'home'};
  if(page==='product-contact'){const product=findProduct(productId);return product&&product.price>0?{page,productId:product.id}:{page:'contact'};}
  return {page:page as FaqPage};
}
const descriptions:Record<FaqPage,{title:string;greeting:string;suggestions:string[]}>= {
  home:{title:'Trabalhos',greeting:'Vamos explorar a coleção? Posso ajudar com os discos, trabalhos e contato.',suggestions:['Como explorar os discos?','Quais artistas estão no portfólio?','Como entrar em contato?']},
  index:{title:'Índice da coleção',greeting:'Aqui você encontra a coleção. Posso explicar a busca, os filtros e a navegação.',suggestions:['Como buscar um trabalho?','Como filtrar por artista?','Quantos trabalhos estão disponíveis?']},
  about:{title:'Sobre Jorak',greeting:'Quer conhecer meu trabalho como editor MMV e motion designer?',suggestions:['Quem é Jorak?','Quais serviços realiza?','Quais ferramentas usa?']},
  products:{title:'Projetos de edição',greeting:'Posso ajudar com os arquivos para Node Video, valores e compatibilidade.',suggestions:['Quais arquivos e preços estão disponíveis?','Node Video 6.70 é compatível?','Como consultar um projeto pago?']},
  academy:{title:'Surfate Academy',greeting:'Posso explicar a relação do Jorak com a academia e indicar o site oficial.',suggestions:['Qual a relação do Jorak com a academia?','Qual é o site oficial?','O que está confirmado sobre a formação?']},
  contact:{title:'Vamos criar',greeting:'Posso ajudar você a apresentar sua ideia no formulário. Os campos preenchidos não são enviados a esta conversa.',suggestions:['Como preencher o formulário?','Quais referências enviar?','Como funciona o orçamento personalizado?']},
  'product-contact':{title:'Interesse no projeto',greeting:'Esta solicitação é para um arquivo específico, com valor fixo. Posso explicar o produto e como enviar seu interesse.',suggestions:['Qual projeto e preço selecionei?','Qual é a compatibilidade?','Como enviar meu interesse?']},
};
export function contextDescription(context:FaqContext){return descriptions[context.page];}
export function contextualSuggestions(context:FaqContext){return descriptions[context.page].suggestions;}
export function contextualFaqAnswer(topic:FaqTopic,data:PortfolioData,context:FaqContext){
  const product=context.page==='product-contact'?findProduct(context.productId):undefined;
  if(product&&['budget','products','portfolio','contact','unknown'].includes(topic))return {answer:`Você escolheu ${product.name}, de ${product.artist}, por ${productPrice(product)}. ${NODE_VIDEO_COMPATIBILITY} Use “Enviar e-mail sobre este projeto” para abrir seu aplicativo de e-mail com os dados preenchidos. Revise e clique em Enviar no aplicativo. Licença, suporte e disponibilidade devem ser combinados com Jorak.`,href:productHref(product),label:'Ver este projeto'};
  if(context.page==='index'&&['portfolio','unknown'].includes(topic))return {answer:`O índice reúne ${data.projects.length} trabalhos. Busque por música, personagem ou artista. Combine “Por artista” com o tipo de entrega; “Limpar busca” restaura os filtros. Selecione um trabalho para abrir seus detalhes.`,href:'/?indice=1',label:'Abrir índice'};
  if(context.page==='home'&&topic==='unknown')return {answer:'Arraste os discos ou use as setas para selecionar. Enter abre a prévia; nela, “Abrir projeto completo” mostra os detalhes. Use Todos ou Por artista para explorar a coleção.',href:'/?visao=todos',label:'Explore a coleção'};
  if(context.page==='products'&&['budget','contact','portfolio','unknown'].includes(topic))return faqAnswer('products',data);
  if(context.page==='academy'&&['identity','services','tools','unknown'].includes(topic))return {...faqAnswer('academy',data),href:ACADEMY_URL,label:'Site oficial da academia'};
  if(context.page==='contact'&&['portfolio','contact','unknown'].includes(topic))return {answer:'No formulário, informe seu nome, e-mail, tipo de edição e uma descrição da ideia. Duração, prazo desejado e links de referência ajudam a avaliar o pedido. O orçamento personalizado e a disponibilidade serão combinados diretamente; não há promessa de prazo ou preço. Seus campos não são enviados ao FAQ.',href:'/contato',label:'Vamos criar'};
  return faqAnswer(topic,data);
}
