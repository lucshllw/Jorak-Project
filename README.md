# Jorak-Project

Portfólio de Jorak, editor MMV e motion designer da cena geek brasileira. A coleção reúne 57 trabalhos com créditos conferidos, 49 artistas, oito destaques, páginas de projeto, apresentação profissional e formulário de orçamento. Todos os discos têm capas verificadas: 41 do Spotify e 16 do YouTube.

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

As chaves ficam somente no servidor. Não adicione prefixo `NEXT_PUBLIC_` a segredos. Nunca envie `.env.local`, dados locais, solicitações de orçamento, credenciais, `node_modules` ou `.next` ao GitHub.

Nenhum recurso Supabase remoto foi criado ou alterado nesta etapa. O catálogo inicial permanece em rascunho para revisão e publicação pelo responsável. Consulte `docs/BANCO-E-OPERACAO.md` para os detalhes operacionais e [docs/VERIFICACAO-MIDIA.md](docs/VERIFICACAO-MIDIA.md) para a validação atual.

## Catálogo, prévias e player

`data/catalog.json` reúne o catálogo e as fontes compactas da pesquisa; não depende dos arquivos temporários de pesquisa para gerar o seed. `npm run catalog:generate` valida capas, créditos, unicidade e intervalos, depois gera o catálogo TypeScript e o SQL local. O SQL exige um banco vazio e não sobrescreve conteúdo existente. Para atualizar somente os metadados pesquisados na prévia local, `node scripts/sync-local-catalog.mjs --apply` mantém mensagens, configurações, publicação e mídias, e cria backup privado.

Os discos abrem balões no computador e um painel inferior no celular. A prévia silenciosa usa `segment.previewUrl`, ou `clipUrl` com intervalo confirmado, carregando somente o projeto aberto. Sem arquivo próprio, mostra a capa e informa que o trecho está em preparação. Navegação por teclado, Escape, foco e preferência por movimento reduzido são respeitados.

O player próprio inclui progresso, volume, atalhos, tela cheia e controles que se recolhem durante a reprodução. **Nenhum recorte nativo real foi preparado ou publicado nesta etapa.** Nove comissões do canal do próprio Jorak estão vinculadas ao lançamento original e tiveram reprodução conferida no site, pelo player externo. A interface do YouTube continua visível; não é coberta por elementos do site.

Há um intervalo com início/fim explícitos e 23 intervalos cujo fim foi derivado do capítulo seguinte. Estes últimos continuam pendentes e não habilitam automaticamente um recorte. As fontes e os limites da pesquisa estão em `docs/CATALOGO-AUDIT-A.md` e `docs/CATALOGO-AUDIT-B.md`; uma entrada indisponível oculta na playlist não foi inventada.

O processamento offline de arquivos autorizados está documentado em [RECORTES-OFFLINE.md](RECORTES-OFFLINE.md). Ele gera uma apresentação H.264/AAC e uma prévia leve sem áudio, sem alterar os originais nem o banco. Arquivos autorizados, confirmação dos intervalos e configuração do projeto Supabase existente ainda são necessários para armazenar e publicar essas mídias em produção. As fixtures sintéticas usadas para testar o player foram removidas do catálogo.
