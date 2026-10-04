import type { PortfolioData } from './types';
import { editingProducts, NODE_VIDEO_COMPATIBILITY, productPrice } from './editing-products.ts';
export const faqTopics = ['identity', 'services', 'artists', 'portfolio', 'contact', 'budget', 'deadline', 'tools', 'products', 'academy', 'unknown'] as const;
export type FaqTopic = typeof faqTopics[number];
export const faqSuggestions = ['Quais projetos para Node Video estão disponíveis?', 'Conhecer a Surface Academy', 'Como pedir um orçamento?'];
export function matchFaq(question: string): FaqTopic {
  const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/academ|surfate|surface|professor|ensino/.test(text)) return 'academy';
  if (/node video|6[.,]70|compatib|arquivo|baixar|comprar|modelo|projetos de edicao/.test(text)) return 'products';
  if (/orcamento|preco|valor|custa|custo|quanto|pagamento/.test(text)) return 'budget';
  if (/prazo|dispon|agenda|entrega|demora|quando|amanha/.test(text)) return 'deadline';
  if (/contato|contrat|email|e-mail|whatsapp|falar|pedir/.test(text)) return 'contact';
  if (/artista|anirap|m4rkim|7 minuto|basara|kaito|neko/.test(text)) return 'artists';
  if (/programa|software|ferramenta|after effect/.test(text)) return 'tools';
  if (/portfolio|projeto|musica|video|assistir|edicao|trabalho/.test(text) && !/tipo|servico|faz/.test(text)) return 'portfolio';
  if (/servico|tipo|faz|mmv|motion/.test(text)) return 'services';
  if (/quem|jorak|carreira|sobre/.test(text)) return 'identity';
  return 'unknown';
}
export function faqAnswer(topic: FaqTopic, data: PortfolioData) {
  const answers: Record<FaqTopic, { answer: string; href: string; label: string }> = {
    identity: { answer: 'Sou Jorak, editor MMV e motion designer da cena geek brasileira. Você pode conhecer minha trajetória e minha apresentação na página Sobre mim.', href: '/sobre', label: 'Sobre mim' },
    services: { answer: 'Meu portfólio reúne edição de videoclipes/MMV, trailers e motion design. Para conversar sobre sua ideia, envie as referências, o tipo de projeto e a duração desejada pelo formulário de contato.', href: '/contato', label: 'Conte sua ideia' },
    artists: { answer: `A coleção reúne trabalhos com ${data.artists.map(a => a.name).join(', ')}. Use o filtro “Por artista” para explorar cada colaboração.`, href: '/?visao=todos', label: 'Explore a coleção' },
    portfolio: { answer: `Você encontra ${data.projects.length} projetos nesta coleção. Os discos abrem as páginas dos trabalhos, com minha edição quando disponível, créditos e links para o lançamento completo.`, href: '/?visao=todos', label: 'Ver os trabalhos' },
    contact: { answer: 'Para falar comigo, use o formulário Vamos criar. Conte a ideia e informe um e-mail de contato. Os links públicos também estão nessa página.', href: '/contato', label: 'Vamos criar' },
    budget: { answer: 'Não há uma tabela de preços para edições personalizadas. O orçamento depende dos detalhes da sua ideia. Os arquivos de projeto para Node Video têm valores próprios no catálogo Projetos de edição. Para contratar uma edição, envie duração, referências e prazo desejado.', href: '/contato', label: 'Solicitar orçamento' },
    products: { answer: `${NODE_VIDEO_COMPATIBILITY} Os arquivos disponíveis são: ${editingProducts.map(product=>`${product.name} (${product.artist}): ${productPrice(product)}`).join('; ')}. Os pagos levam à consulta pelo contato; Cristino tem um link de download gratuito no catálogo.`, href:'/projetos-de-edicao',label:'Consultar os 14 projetos' },
    academy: { answer:'A academia apresentada como Surface Academy neste site usa o nome oficial Surfate Academy. Jorak integra a equipe como professor de animação 2D no celular. Consulte a página da academia e o site oficial para conhecer a formação.',href:'/surface-academy',label:'Conhecer a academia' },
    deadline: { answer: 'Prazos e disponibilidade precisam ser combinados diretamente comigo. Informe sua data desejada no formulário; a conversa permite avaliar o projeto antes de confirmar a entrega.', href: '/contato', label: 'Conversar sobre o projeto' },
    tools: { answer: 'As ferramentas verificadas estão indicadas nas páginas dos projetos correspondentes. A escolha pode variar de um trabalho para outro; consulte a edição e os créditos de cada lançamento.', href: '/?visao=todos', label: 'Consultar projetos' },
    unknown: { answer: 'Posso ajudar com informações sobre meus trabalhos, serviços e contato. Essa informação específica ainda não está cadastrada; envie sua dúvida pelo formulário para conversar comigo.', href: '/contato', label: 'Falar com Jorak' },
  };
  return answers[topic];
}
