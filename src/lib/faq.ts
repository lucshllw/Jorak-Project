import type { PortfolioData } from './types';
export const faqTopics = ['identity', 'services', 'artists', 'portfolio', 'contact', 'budget', 'deadline', 'tools', 'unknown'] as const;
export type FaqTopic = typeof faqTopics[number];
export const faqSuggestions = ['Que tipo de edição você faz?', 'Com quais artistas você trabalhou?', 'Como pedir um orçamento?'];
export function matchFaq(question: string): FaqTopic {
  const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
    budget: { answer: 'Não há uma tabela de preços cadastrada neste portfólio. O orçamento depende dos detalhes do projeto. Envie sua ideia, duração, referências e prazo desejado para conversarmos.', href: '/contato', label: 'Solicitar orçamento' },
    deadline: { answer: 'Prazos e disponibilidade precisam ser combinados diretamente comigo. Informe sua data desejada no formulário; a conversa permite avaliar o projeto antes de confirmar a entrega.', href: '/contato', label: 'Conversar sobre o projeto' },
    tools: { answer: 'As ferramentas verificadas estão indicadas nas páginas dos projetos correspondentes. A escolha pode variar de um trabalho para outro; consulte a edição e os créditos de cada lançamento.', href: '/?visao=todos', label: 'Consultar projetos' },
    unknown: { answer: 'Posso ajudar com informações sobre meus trabalhos, serviços e contato. Essa informação específica ainda não está cadastrada; envie sua dúvida pelo formulário para conversar comigo.', href: '/contato', label: 'Falar com Jorak' },
  };
  return answers[topic];
}
