import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Rebuild only the researched seed, not content saved by the editor.
// Editorial metadata comes from the public playlist and the client's curation.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async (name) => JSON.parse(await readFile(path.join(root, 'research', name), 'utf8'));
const [playlist, confirmed, curation] = await Promise.all([
  read('catalogo-playlist.json'), read('projetos-confirmados.json'), read('curadoria-portfolio.json'),
]);
const slugify = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ø/gi, 'o').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const uuid = (value) => {
  const h = createHash('sha256').update(`jorak:${value}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

// Main artist first; additional artists are explicitly named in playlist titles.
// A publishing channel is not silently treated as a featured performer.
const entries = [
  ['Espetáculo de Kaiser', ['Igris'], 'Michael Kaiser', 'Blue Lock'],
  ['Mensageiro', ['Kaito'], 'Vivian Hugo', 'Blue Lock'],
  ['Carrasco', ['Ranori'], 'Homem-Aranha Noir', ''],
  ['Anomalia', ['Slow GM'], '', 'Mob Psycho 100'],
  ['Convidado Especial', ['oShaman'], 'Acony', ''],
  ['Rota da Gula', ['Shiny'], 'Subaru Natsuki', 'Re:Zero IF'],
  ['Herói do Japão', ['NeshyzK'], 'Isagi Yoichi', 'Blue Lock'],
  ['KARMA', ['Basara'], 'Diego', 'Sense Life'],
  ['Lampião de Espinhos', ['Shiny'], 'Cristino', 'Ordem Paranormal: Hexatombe'],
  ['Tipo Inosuke 2', ['MHRAP'], 'Inosuke', 'Kimetsu no Yaiba'],
  ['América', ['Ranori'], 'Funny Valentine', 'JoJo'],
  ['Cara De Sorte', ['Basara'], 'Hakari Kinji', 'Jujutsu Kaisen'],
  ['SOCANDO NESSES BETINHAS', ['Ashur4'], 'Akaza, Tanjiro e Tomioka', 'Demon Slayer'],
  ['ADO ADO do MASKARADO', ['PeJota'], 'Máskara', 'The Mask'],
  ['A Guerra Sangrenta dos Mil Anos', ['PeJota'], 'Gotei 13', 'Bleach'],
  ['Morte Branca', ['PeJota', 'Geedix'], 'Simo Häyhä', 'Shuumatsu no Valkyrie'],
  ['Indie Cross', ['Chevz', 'Andrômeda'], '', 'Indies'],
  ['Deus do Lixo', ['PeJota', 'Bagguh'], 'Rudo Surebrec', 'Gachiakuta'],
  ['Vingança', ['Mathover'], 'Uruma', 'Juujika no Rokunin'],
  ['OBSESSÃO', ['As Ace'], 'Itoshi Rin', 'Blue Lock'],
  ['Vem pro QUARTO levar ESPADA', ['Kaji'], 'Ulquiorra', 'Bleach'],
  ['De Joelhos', ['Fokes'], 'Michael Kaiser', 'Blue Lock'],
  ['Arcanjo Caído', ['MSdaiki'], 'Estarossa', 'Nanatsu no Taizai'],
  ['Serviçal', ['Theuz'], 'Alexis Ness', 'Blue Lock'],
  ['RESTRIÇÃØ', ['NeshyzK'], 'Maki Zenin', ''],
  ['Metempsicose', ['Caneco'], 'Kenjaku', 'Jujutsu Kaisen'],
  ['Costuras', ['Caneco'], 'Juuzo Suzuya', 'Tokyo Ghoul'],
  ['Renascer', ['oTaiyo'], 'Hiori Yo', ''],
  ['Lixo à Glória', ['Caneco'], 'Don Lorenzo', 'Blue Lock'],
  ['Pela Pátria!', ['NeshyzK'], 'Funny Valentine', ''],
  ['Robozão', ['OKUMURA'], 'Chris Prince', 'Blue Lock'],
  ['Coisa Ruim', ['Rou', 'LiuKay'], 'Akaza', 'Kimetsu no Yaiba'],
  ['Memórias Roubadas', ['ÉoSans'], 'Akaza', 'Kimetsu no Yaiba'],
  ['Celestial', ['Mathover'], 'Doflamingo', 'One Piece'],
  ['CAIR DA LUA', ['M4rques'], 'Akaza', 'Kimetsu no Yaiba'],
  ['Trucido Infindável', ['TutuFlow'], 'William Afton', 'FNAF'],
  ['ANJO CAÍDO', ['Storini'], 'Sukuna', 'Jujutsu Kaisen'],
  ['CRIAÇÃO PERFEITA', ['Storini'], 'Shadow', 'Sonic'],
  ['Infame', ['As Ace'], 'Majin Boo', 'Dragon Ball'],
  ['No topo do clã', ['KMG GEEK'], 'Igris', 'Solo Leveling'],
  ['Wave Tokito', ['ÉoShadow'], 'Tokito', 'Kimetsu no Yaiba'],
  ['Quando Ela Chegou', ['Sunny', 'Reinehr'], 'Yuta Okkotsu', 'Jujutsu Kaisen'],
  ['ZERØ', ['Arthurzinn*'], '', 'Especial Sem Poderes'],
  ['CORRENTEZA', ['NaSants', 'niallzin'], 'Giyu Tomioka', 'Demon Slayer'],
  ['Eu Não Sou Um Vilão', ['SecretRaps'], 'Itachi Uchiha', 'Naruto'],
  ['ERGAM-SE', ['Storini'], 'Sung Jin Woo', 'Solo Leveling'],
  ['VIVA O PIVETE', ['Kaji'], 'Noah Que Ri', 'Sense Life'],
  ['Doçura', ['Neko'], 'Katakuri', 'One Piece'],
  ['O Primeiro Rei', ['AniRap'], 'Qin Shi Huang', 'Shuumatsu no Valkyrie'],
  ['Traição de Sangue', ['Igris'], 'Itoshi Rin', 'Blue Lock'],
  ['death.', ['The Zane'], 'Death The Kid', 'Soul Eater'],
  ['Gols e Travessuras', ['Neko'], 'Charles Chevalier', 'Blue Lock'],
  ['Maldito', ['Arkay', 'Ark King', 'Igris', 'Kazuya'], 'Itadori Yuji', ''],
  ['IMPERADOR', ['M4rkim'], 'Michael Kaiser', 'Blue Lock'],
  ['Faminto', ['AniRap'], 'Ryu Ishigori', 'Jujutsu Kaisen'],
  ['SOU DEUS', ['7 Minutoz'], 'Capitão Pátria', 'The Boys'],
];

const spotify = {
  _XKG7mIdLeg: { slug: 'faminto', url: 'https://open.spotify.com/album/3ajbGUaJCkM6OwMsWmqnjc', image: 'https://i.scdn.co/image/ab67616d0000b273b31721119e7d579c17602245' },
  fZoCEzumGi8: { slug: 'imperador', url: 'https://open.spotify.com/track/4zcveMG30tjXhRNlM71fjK', image: 'https://i.scdn.co/image/ab67616d0000b273a2d53b8d55bbca88576b49fc' },
  oMgMrZERlS0: { slug: 'o-primeiro-rei', url: 'https://open.spotify.com/track/2YoYcn0YRs1PgIHhkYcq02', image: 'https://i.scdn.co/image/ab67616d0000b27394b37f1986eba828f9c9365a' },
  aNlMrwrkcxU: { slug: 'mensageiro', url: 'https://open.spotify.com/album/3JHFTAP5ipXDHYsupWZ3A9', image: 'https://i.scdn.co/image/ab67616d0000b273b088828663fef11e18738aac' },
  qFGJYdGufbE: { slug: 'gols-e-travessuras', url: 'https://open.spotify.com/album/6ItvEy5v6Abn22N8yZuTEa', image: 'https://i.scdn.co/image/ab67616d0000b2737fd66237d4635d292bd78aa7' },
  EQkAA4HPmvQ: { slug: 'cara-de-sorte', url: 'https://open.spotify.com/album/3MWfIZ8e8Xbf456Z2QTuhE', image: 'https://i.scdn.co/image/ab67616d0000b27369846b0c425e262534171759' },
  '-HOdjvjt0HE': { slug: 'carrasco', url: 'https://open.spotify.com/album/6CPMmrmbJSyaNQFoBekyCC', image: 'https://i.scdn.co/image/ab67616d0000b27314d6bf40b151fc9720a85d0d' },
  uWhchQMpuHI: { slug: 'convidado-especial', url: 'https://open.spotify.com/album/1YnzIudnUXTVuX8Lrj4xIJ', image: 'https://i.scdn.co/image/ab67616d0000b2732e74c1cabd628dab771a2a66' },
};
const playlistUrl = 'https://www.youtube.com/playlist?list=PLBqgTMAHmvR2npmzG-t4-MftEJbRYhZbP';
const videoId = (url) => new URL(url).searchParams.get('v');
const artistNames = [...new Set(entries.flatMap((entry) => entry[1]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
const artists = artistNames.map((name) => ({ id: uuid(`artist:${slugify(name)}`), name, slug: slugify(name) }));
const artistByName = new Map(artists.map((a) => [a.name, a]));
const fmt = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const accent = { _XKG7mIdLeg: '#b5d49a', fZoCEzumGi8: '#c5b0e8', oMgMrZERlS0: '#dec176', aNlMrwrkcxU: '#a7c4dc', qFGJYdGufbE: '#deb4a1', EQkAA4HPmvQ: '#abd3b4', '-HOdjvjt0HE': '#aeb5b0', uWhchQMpuHI: '#bcb2dc' };

if (playlist.length !== entries.length) throw new Error('A playlist e o mapeamento editorial divergem.');
const projects = playlist.map((source, i) => {
  const [title, names, character, work] = entries[i];
  const id = videoId(source.url);
  const verified = confirmed.find((p) => videoId(p.youtube_url) === id);
  const featured = curation.featured_projects.find((p) => videoId(p.youtube_url) === id);
  const media = spotify[id];
  // Guests must be literal credits in the title, not names inferred from a scene,
  // a publishing channel, the description of an effect or Jorak's collaborators.
  for (const guest of names.slice(1)) {
    if (!slugify(source.title).includes(slugify(guest))) throw new Error(`Crédito de convidado sem fonte explícita: ${guest} em ${title}`);
  }
  const ranges = verified?.segments ?? featured?.segments ?? [];
  const segments = ranges.map((range, n) => ({
    id: uuid(`segment:${id}:${n}`), name: ranges.length > 1 ? `Trecho ${n + 1}` : 'Minha participação',
    start: range.start_seconds, end: range.end_seconds, clipUrl: null, kind: 'edit', order: n,
  }));
  const participation = verified
    ? `Jorak aparece nos créditos oficiais deste vídeo.${segments.length ? ` Intervalos identificados: ${segments.map((s) => `${fmt(s.start)}–${fmt(s.end)}`).join(' e ')}.` : ' O intervalo exato da participação será confirmado pelo editor.'}`
    : featured
      ? 'Trabalho selecionado para o portfólio pelo cliente. O intervalo da participação e os créditos completos aguardam confirmação.'
      : 'Projeto presente na playlist do editor. A descrição da participação e os intervalos aguardam revisão de Jorak.';
  let verification = verified
    ? `Participação confirmada na descrição oficial. ${verified.range_evidence}.`
    : featured
      ? 'Seleção enviada pelo cliente e música presente na playlist. Créditos oficiais e tempos pendentes.'
      : 'Identificado na playlist oficial. Participação individual, créditos e tempos pendentes de revisão.';
  if (source.context.includes('Só para membros')) verification += ' O vídeo foi identificado como exclusivo para membros durante a pesquisa.';
  if (id === 'EwJtgNGoTlY') verification += ' O título credita TutuFlow e a publicação está no canal Arthurzinn*. A relação entre esses nomes aguarda confirmação; o canal não foi incluído como artista convidado.';
  return {
    id: uuid(`project:${id}`), slug: `${slugify(title)}-${slugify(names[0])}`, title, character, work,
    artistIds: names.map((name) => artistByName.get(name).id), category: 'MMV', date: null,
    summary: `${title} — ${names.join(', ')}.${character ? ` ${character}${work ? ` / ${work}` : ''}.` : work ? ` ${work}.` : ''}`,
    participation, process: '', techniques: [], tools: [],
    credits: verified ? 'Jorak é um dos editores creditados no vídeo oficial. A ficha completa de colaboradores ainda será preenchida.' : '',
    creditSource: verified ? source.url : playlistUrl,
    coverUrl: media ? `/media/covers/${media.slug}.jpg` : null, coverSource: media ? 'spotify' : null,
    coverAlt: media ? `Capa oficial de ${title}, lançamento de ${names[0]}` : `Capa de ${title} pendente`,
    coverPosition: { x: 50, y: 50 }, coverCredit: media ? 'Arte do lançamento disponibilizada no Spotify. Autoria da capa a confirmar.' : '',
    youtubeUrl: source.url, spotifyUrl: media?.url ?? null, xUrl: verified?.x_source ?? null,
    segments, processImages: [], featured: Boolean(featured), featuredOrder: featured?.featured_order ?? null,
    order: i + 1, status: 'draft', accent: accent[id] ?? '#b7bdad', verification,
  };
});

if (new Set(projects.map((p) => p.id)).size !== projects.length) throw new Error('Há músicas duplicadas no catálogo.');
if (projects.filter((p) => p.featured).length !== 8) throw new Error('A curadoria deve conter oito destaques.');
for (const project of projects) {
  for (const segment of project.segments) if (!(segment.start >= 0 && segment.end > segment.start)) throw new Error(`Intervalo inválido: ${project.title}`);
}

const data = {
  mode: 'local', artists, projects,
  settings: {
    name: 'Jorak', avatarUrl: '/media/jorak-avatar.jpg', headline: 'Histórias que ganham movimento.',
    bio: 'Editor MMV, motion designer e professor da Surfate Academy. Entre música, mangá e movimento, meu trabalho faz parte da cena geek brasileira.',
    career: 'Atuo como editor MMV e motion designer em projetos da cena geek, com participações creditadas em trabalhos de AniRap, M4rkim, 7 Minutoz e outros artistas. Na Surfate Academy, ensino animação 2D no celular. Este portfólio reúne essas participações e os trechos que acompanham cada música.',
    email: 'lvilaard@gmail.com', xUrl: 'https://x.com/Jorakeditor', instagramUrl: '', linktreeUrl: 'https://linktr.ee/Joraknv', whatsapp: '', showreelUrl: '',
  },
};
await mkdir(path.join(root, 'src', 'lib'), { recursive: true });
await writeFile(path.join(root, 'src', 'lib', 'seed.ts'), `// Generated by scripts/seed-catalog.mjs from researched public sources.\n// All entries remain drafts until the owner reviews their participation and media.\nimport type { PortfolioData } from './types';\n\nexport const seedPortfolio: PortfolioData = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
console.log(`${projects.length} projetos; ${artists.length} artistas; 8 destaques; ${confirmed.length} participações creditadas; todos em rascunho.`);

// Optional network operation: explicit acquisition of official cover images.
// No videos, audio previews, cookies or authenticated pages are downloaded.
if (process.argv.includes('--download-covers')) {
  await mkdir(path.join(root, 'public', 'media', 'covers'), { recursive: true });
  for (const media of Object.values(spotify)) {
    const response = await fetch(media.image);
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error(`Falha na capa oficial: ${media.slug}`);
    await writeFile(path.join(root, 'public', 'media', 'covers', `${media.slug}.jpg`), new Uint8Array(await response.arrayBuffer()));
    console.log(`Capa oficial: ${media.slug}`);
  }
}
