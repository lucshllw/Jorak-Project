# Jorak-Project

Portfólio de Jorak, editor MMV e motion designer da cena geek brasileira. A coleção reúne 57 trabalhos com créditos conferidos, 49 artistas, oito destaques, páginas de projeto, apresentação profissional e formulário de orçamento. Todos os discos têm capas verificadas: 41 do Spotify e 16 do YouTube.

A entrega local possui **22 projetos com vídeo próprio** (21 edições e um trailer), **23 apresentações com áudio**, versões menores para celular e **22 discos com prévias reproduzíveis**. Os 35 projetos restantes têm sua pendência documentada individualmente em [MIDIAS-REAIS.md](docs/MIDIAS-REAIS.md). Os arquivos de mídia são preparados fora do Git; o repositório contém as fontes revisadas, evidências e o processo reproduzível.

A versão atual é exclusivamente pública: não contém login, cadastro, painel, sessão ou APIs administrativas. A conversa com o personagem será adicionada em uma etapa futura.

## Executar localmente

Requer Node.js 22 ou superior compatível com Next.js e npm.

```sh
npm ci
npm run setup:local
npm run dev -- --port 3100
```

Abra http://127.0.0.1:3100. O setup cria somente a configuração de desenvolvimento, sem senha. Não substitui um arquivo privado já existente. A prévia mostra o catálogo pesquisado, inclusive rascunhos; em produção, o Supabase entrega somente projetos publicados.

## Verificar

```sh
npm test
npm run typecheck
npm run build
```

Com o servidor local em execução, o teste de integração verifica as rotas removidas, privacidade, catálogo, contato, validação e mídia com Range:

```sh
node src/lib/server/public.integration.mjs http://127.0.0.1:3100
```

Execute esse teste apenas no desenvolvimento. Ele cria fixtures identificadas por UUID e remove somente esses registros no final. Reinicie o servidor após testar o limite de contato para limpar o contador temporário de spam.

## Identidade e logo

A interface usa Archivo local, fundo escuro e destaques em verde esmeralda. O avatar atualizado e o lettering original foram fornecidos pelo cliente. A marca grande usa perfis vetoriais, geometria extrudada, chanfros, materiais físicos, sombras e movimento coordenado. Há fallback PNG para indisponibilidade de WebGL; a preferência por movimento reduzido interrompe os movimentos.

Os contornos preparados ficam em `public/media/jorak-logo-shapes.json`. O script Python de preparação não é necessário para executar o site. Fontes e origens de mídia estão documentadas em `docs/ATIVOS.md` e `docs/LOGO-3D.md`.

## Configuração online

A publicação do código no GitHub não configura uma hospedagem ou um banco. Para operação online, conecte o projeto Supabase existente com as variáveis de `.env.example`, aplicando as migrations na ordem. A última migration revoga o antigo acesso administrativo, preserva os dados e mantém RLS e o bucket privado.

As chaves ficam somente no servidor. Não adicione prefixo `NEXT_PUBLIC_` a segredos. Nunca envie `.env.local`, dados locais, vídeos, solicitações de orçamento, credenciais, `node_modules` ou `.next` ao GitHub.

Nenhum recurso Supabase remoto foi criado ou alterado nesta etapa. O catálogo inicial permanece em rascunho para revisão e publicação pelo responsável. Consulte `docs/BANCO-E-OPERACAO.md` para os detalhes operacionais e [docs/MIDIAS-REAIS.md](docs/MIDIAS-REAIS.md) para a entrega e a validação atuais.

## Catálogo, prévias e player

`data/catalog.json` reúne o catálogo e as fontes compactas da pesquisa; não depende dos arquivos temporários de pesquisa para gerar o seed. `npm run catalog:generate` valida capas, créditos, unicidade e intervalos, depois gera o catálogo TypeScript e o SQL local. O SQL exige um banco vazio e não sobrescreve conteúdo existente. Para atualizar somente os metadados pesquisados na prévia local, `node scripts/sync-local-catalog.mjs --apply` mantém mensagens, configurações, publicação e mídias, e cria backup privado.

Os discos abrem balões no computador e um painel inferior no celular. A prévia silenciosa usa `segment.previewUrl`, ou `clipUrl` com intervalo confirmado, carregando somente o projeto aberto. Sem arquivo próprio, mostra a capa e informa que o trecho está em preparação. Navegação por teclado, Escape, foco e preferência por movimento reduzido são respeitados.

O player próprio inclui progresso, volume, atalhos, tela cheia e controles que se recolhem durante a reprodução. Os arquivos reais usam um quadro da edição e um único botão de play, sem iframe, título sobreposto ou laterais cinzas. Créditos, links e duração ficam fora da imagem. O celular recebe a versão de até 720p, mantendo áudio, proporção e intervalo; o computador conserva a apresentação de alta qualidade. Vídeos externos continuam disponíveis somente onde falta arquivo próprio.

Há um intervalo com início/fim explícitos e 23 intervalos cujo fim foi derivado do capítulo seguinte. Estes últimos continuam pendentes e não habilitam automaticamente um recorte. As fontes e os limites da pesquisa estão em `docs/CATALOGO-AUDIT-A.md` e `docs/CATALOGO-AUDIT-B.md`; uma entrada indisponível oculta na playlist não foi inventada.

O processo está documentado em [RECORTES-OFFLINE.md](RECORTES-OFFLINE.md). `npm run media:prepare` mostra o plano; `--execute --import-local` obtém as fontes públicas revisadas com yt-dlp, exporta H.264/AAC, gera a prévia, o quadro e a versão para celular, e associa as mídias somente na prévia local. Requer as ferramentas indicadas no documento. Os originais são preservados. Para produção ainda faltam o projeto Supabase existente, envio dos arquivos e associação das referências publicadas. As fixtures sintéticas não entram nas contagens de entrega.
