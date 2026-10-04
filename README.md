# Jorak-Project

Portfólio de Jorak, editor MMV e motion designer da cena geek brasileira. A coleção reúne 56 trabalhos pesquisados, filtros por artista, oito destaques, páginas de projeto, vídeos oficiais, apresentação profissional e formulário de orçamento.

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

Nenhum recurso Supabase remoto foi criado ou alterado nesta etapa. Conteúdos sem capa ou trechos confirmados permanecem como rascunhos. Consulte `docs/BANCO-E-OPERACAO.md` para os detalhes operacionais e `docs/VERIFICACAO.md` para o que foi efetivamente validado.
