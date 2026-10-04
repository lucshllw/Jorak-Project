# Ativos e catálogo inicial

Levantamento de 3 de outubro de 2026. O conteúdo inicial é uma **prévia editorial local**: todos os projetos estão em rascunho até revisão e publicação pelo proprietário. Uma capa confirmada não confirma o intervalo de edição, a autoria da arte ou as ferramentas usadas.

## Avatar atual fornecido pelo cliente

O cliente enviou três imagens e escolheu explicitamente o último ícone, uma ilustração de dois personagens, como novo avatar. O arquivo de origem é `codex-clipboard-fbea6a3a-d7d2-4729-869c-9382bcd9c2b6.png`, 1600 × 1600 pixels. Não é uma imagem criada por IA para este projeto.

- Original preservado: `public/media/jorak-avatar-original.png`, sem alteração.
- Arquivo aplicado: `public/media/jorak-avatar.jpg`, 800 × 800 pixels, JPEG com qualidade 95. Somente redução proporcional da imagem inteira; nenhum rosto ou elemento foi recortado.
- Ícone do site: `src/app/icon.png`, 256 × 256 pixels, PNG com a mesma composição inteira.
- O endereço `/media/jorak-avatar.jpg` foi preservado; nenhuma configuração de conteúdo ou banco foi alterada para substituir a imagem.

A referência anterior, de 400 × 400 pixels e um personagem com chapéu verde, continua preservada em `research/jorak-avatar-x.jpg`. Ela veio da [foto do perfil de Jorak no X](https://x.com/Jorakeditor/photo), observada em <https://pbs.twimg.com/profile_images/1969578612199174147/0vRtKpkJ_400x400.jpg>. O primeiro dos três novos anexos reproduz essa referência, e o último é a escolha atual do cliente.

## Banner e lettering original JORAK

O cliente forneceu o banner original no segundo anexo, `codex-clipboard-3c5b8e16-5a7b-45ef-93d1-2d30e7df7750.png`, 1559 × 907 pixels. A arte confirma a referência anteriormente observada no perfil: JORAK em letras grandes, angulosas e ilustradas, preenchimento verde, contorno branco e sombra escura, com elementos verdes e violetas no fundo.

- `public/media/jorak-banner-original.png`: cópia integral do anexo, sem alteração.
- `public/media/jorak-banner.webp`: arte inteira com somente as margens pretas externas verticais removidas. Recorte do original: **x=0…1559, y=319…593**, com limite final exclusivo. Dimensão resultante: **1559 × 274 pixels**, proporção **5,689781:1**. Toda a largura foi mantida; não houve esticamento ou recorte de personagens, letras ou contornos.
- `public/media/jorak-wordmark.png`: lettering original isolado em raster RGBA, **594 × 223 pixels**, proporção **2,663677:1**, com quatro pixels transparentes de respiro em cada lado. As cinco letras e seus contornos foram conferidos visualmente.

A transparência foi obtida pelo contorno branco conectado, fechamento mínimo de microvãos da máscara e preenchimento da silhueta. O RGB de **cada pixel visível** foi comparado com o pixel correspondente do banner original e coincide exatamente. Somente o canal de transparência foi trabalhado; nenhuma letra, cor, fonte, contorno ou detalhe foi redesenhado, gerado ou preenchido artificialmente. O fundo original é preservado onde está dentro da silhueta.

Para alinhar a camada do lettering sobre o banner, seu conteúdo visível ocupa **(550,30) até (1136,245)** na arte recortada: 586 × 215 pixels. Incluindo o respiro transparente, a caixa PNG deve ficar em **x=546, y=26**, com 594 × 223 pixels, sobre o banner de 1559 × 274. Equivalentes proporcionais: left **35,02245%**, top **9,48905%**, width **38,10135%**, height **81,38686%**. Preserve essas proporções ao dimensionar ou aplicar perspectiva; a marca não deve virar texto de uma fonte substituta.

## Capas oficiais dos oito destaques

As imagens abaixo são os arquivos públicos `og:image` de páginas oficiais do Spotify, consultadas diretamente e conferidas pelo título e artista do lançamento. Não são thumbnails do YouTube, quadros de vídeos ou imagens geradas. Os oito JPEGs têm 640 × 640 pixels. A página de origem permanece em `spotifyUrl`, e `coverSource` é `spotify`.

| Ordem | Projeto | Arquivo local | Lançamento verificado |
|---|---|---|---|
| 1 | Faminto — AniRap | `public/media/covers/faminto.jpg` | [Spotify](https://open.spotify.com/album/3ajbGUaJCkM6OwMsWmqnjc) |
| 2 | IMPERADOR — M4rkim | `public/media/covers/imperador.jpg` | [Spotify](https://open.spotify.com/track/4zcveMG30tjXhRNlM71fjK) |
| 3 | O Primeiro Rei — AniRap | `public/media/covers/o-primeiro-rei.jpg` | [Spotify](https://open.spotify.com/track/2YoYcn0YRs1PgIHhkYcq02) |
| 4 | Mensageiro — Kaito | `public/media/covers/mensageiro.jpg` | [Spotify](https://open.spotify.com/album/3JHFTAP5ipXDHYsupWZ3A9) |
| 5 | Gols e Travessuras — Neko | `public/media/covers/gols-e-travessuras.jpg` | [Spotify](https://open.spotify.com/album/6ItvEy5v6Abn22N8yZuTEa) |
| 6 | Cara De Sorte — Basara | `public/media/covers/cara-de-sorte.jpg` | [Spotify](https://open.spotify.com/album/3MWfIZ8e8Xbf456Z2QTuhE) |
| 7 | Carrasco — Ranori | `public/media/covers/carrasco.jpg` | [Spotify](https://open.spotify.com/album/6CPMmrmbJSyaNQFoBekyCC) |
| 8 | Convidado Especial — oShaman | `public/media/covers/convidado-especial.jpg` | [Spotify](https://open.spotify.com/album/1YnzIudnUXTVuX8Lrj4xIJ) |

Os nomes artísticos exibidos no site seguem a curadoria do cliente e a playlist: Spotify registra AniRap como `anirap`, Kaito como `Kaito Rapper` e Shiny como `Shiny_sz`. A normalização reúne essas variações, sem criar artistas repetidos. A autoria de cada capa ainda deve ser preenchida pelo proprietário, por isso o cadastro diz “Arte do lançamento disponibilizada no Spotify. Autoria da capa a confirmar.”

URLs exatas das imagens, para rastrear a origem:

- Faminto: <https://i.scdn.co/image/ab67616d0000b273b31721119e7d579c17602245>.
- IMPERADOR: <https://i.scdn.co/image/ab67616d0000b273a2d53b8d55bbca88576b49fc>.
- O Primeiro Rei: <https://i.scdn.co/image/ab67616d0000b27394b37f1986eba828f9c9365a>.
- Mensageiro: <https://i.scdn.co/image/ab67616d0000b273b088828663fef11e18738aac>.
- Gols e Travessuras: <https://i.scdn.co/image/ab67616d0000b2737fd66237d4635d292bd78aa7>.
- Cara De Sorte: <https://i.scdn.co/image/ab67616d0000b27369846b0c425e262534171759>.
- Carrasco: <https://i.scdn.co/image/ab67616d0000b27314d6bf40b151fc9720a85d0d>.
- Convidado Especial: <https://i.scdn.co/image/ab67616d0000b2732e74c1cabd628dab771a2a66>.

As outras 48 músicas permanecem com `coverUrl: null` e `spotifyUrl: null`. O proprietário pode completar esses campos pelo painel. A galeria deve identificar a ausência e nunca substituir silenciosamente uma capa por thumbnail.

## Vídeos, áudio e créditos

Não foram baixados vídeos, prévias de áudio ou arquivos de edição remotos. Os 56 registros possuem o link do vídeo identificado na playlist do próprio editor. `clipUrl` permanece nulo até o upload do proprietário.

Os 14 trabalhos de `research/projetos-confirmados.json` têm participação confirmada na descrição oficial do YouTube. Oito desses trabalhos têm intervalos pesquisados; Convidado Especial possui dois intervalos. Apenas IMPERADOR publica início e fim explicitamente. Nos demais, o término corresponde à entrada do próximo editor e pode precisar de ajuste no arquivo exportado. A existência de uma publicação no X não permite derivar automaticamente sua posição na música completa.

Faminto, O Primeiro Rei e Mensageiro têm crédito confirmado, com minutagem pendente. Gols e Travessuras e Cara De Sorte foram escolhidos pelo cliente e estão na playlist; seus tempos e a descrição oficial dos créditos ainda aguardam revisão. Não foram inventadas ferramentas, processos, depoimentos ou datas de comissão.

Um item indisponível da playlist não pôde ser identificado e não ganhou um registro fictício. Tipo Inosuke 2 foi identificado como exclusivo para membros durante a pesquisa; o texto de verificação preserva essa informação. Se o player não permitir a reprodução, mantenha o link oficial e uma mensagem clara.

## Fontes locais com licença aberta

| Família | Arquivos | Origem e licença |
|---|---|---|
| Archivo | `public/fonts/archivo-variable.ttf` | [Google Fonts / Archivo](https://github.com/google/fonts/tree/main/ofl/archivo); SIL Open Font License 1.1, incluída em `public/fonts/archivo-OFL.txt` |
| Instrument Serif | `public/fonts/instrument-serif.ttf`, `public/fonts/instrument-serif-italic.ttf` | [Google Fonts / Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif); SIL Open Font License 1.1, incluída em `public/fonts/instrument-serif-OFL.txt` |

Archivo oferece pesos variáveis de 100 a 900 e eixo de largura. Instrument Serif possui regular e itálico, peso 400. A tipografia pode ser carregada com `next/font/local` ou `@font-face`; não exige acesso ao Google Fonts em tempo de build ou no navegador. Preserve as licenças ao redistribuir os arquivos.

## Regenerar o catálogo de desenvolvimento

`node scripts/seed-catalog.mjs` reconstrói apenas `src/lib/seed.ts` usando os arquivos de pesquisa e o mapeamento editorial. Não importa conteúdo remoto e não modifica os dados que o editor salvou no painel ou no banco.

`node scripts/seed-catalog.mjs --download-covers` também baixa novamente as oito imagens oficiais da tabela. É uma operação opcional de rede; as imagens já estão incluídas no projeto.

O seed contém 56 projetos únicos e 46 artistas: 38 principais distintos e oito nomes que aparecem exclusivamente como convidados. Os vínculos adicionais vêm literalmente dos títulos pesquisados: Geedix em Morte Branca; Bagguh em Deus do Lixo; Andrômeda em Indie Cross; LiuKay em Coisa Ruim; Reinehr em Quando Ela Chegou; niallzin em CORRENTEZA; Ark King, Igris e Kazuya em Maldito. Igris já possui trabalhos próprios e não aumenta o número de convidados exclusivos. Não foram incluídos personagens, editores ou produtores apenas mencionados no processo.

Cada colaboração usa um único projeto com vários `artistIds`, com o artista principal em primeiro lugar. O gerador exige que todo nome adicional esteja explicitamente presente no título de origem. IDs são UUIDs determinísticos, derivados do vídeo oficial e do artista normalizado, para que uma nova execução não duplique registros. Slugs usam `título-artista`, por exemplo `faminto-anirap` e `imperador-m4rkim`.

Trucido Infindável credita TutuFlow no título, embora tenha sido publicado no canal Arthurzinn*. Essa relação de identidade permanece em revisão. O canal não foi promovido a convidado dessa música nem os dois nomes foram fundidos sem confirmação; Arthurzinn* possui seu próprio registro por ZERØ, cujo título o credita expressamente.

A ordem dos oito destaques segue `research/curadoria-portfolio.json` e é independente da ordem da playlist. Todos os projetos do seed permanecem `draft`. A prévia local pode exibi-los identificados como rascunhos; a leitura pública do banco deve mostrar somente projetos publicados e validados. Não use o catálogo local como fallback público quando o banco estiver configurado e não houver projetos publicados.
