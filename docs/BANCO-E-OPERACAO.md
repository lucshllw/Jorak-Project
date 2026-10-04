# Dados e operação

A aplicação contém o portfólio público, a reprodução dos trabalhos e o formulário de contato. A conversa com o personagem será adicionada em uma etapa futura. A área administrativa foi retirada: não há login, cadastro, sessão, painel, APIs de curadoria nem upload pelo site. As credenciais de administrador e seus geradores foram removidos.

## Rodar localmente

1. Instale as dependências com `npm ci`.
2. Execute `npm run setup:local -- --port 3100`. O comando cria apenas uma configuração local privada; não gera senha nem usuário. Se `.env.local` já existir, não o sobrescreve.
3. Execute `npm run dev -- --port 3100` e abra `http://127.0.0.1:3100`.

`.env.local`, `.local-data`, dependências e arquivos de build ficam fora do Git. `.env.example` contém somente valores fictícios. O modo local é recusado com `NODE_ENV=production`; o servidor e o backend exigem endereço loopback.

`.local-data/portfolio.json` conserva projetos, artistas, apresentação, mensagens e metadados de mídia. Arquivos existentes permanecem em `.local-data/uploads`. O seed é materializado no primeiro acesso; mensagens de contato sobrevivem à recarga e ao reinício. As gravações usam exclusão mútua, trava em arquivo e troca atômica de arquivo sincronizado. Dados existentes não são substituídos silenciosamente pelo seed.

`PORTFOLIO_LOCAL_PREVIEW=true` mostra também o catálogo de rascunhos durante o desenvolvimento neste computador. Esses itens não passam a publicados. Projetos arquivados não aparecem. Essa configuração não altera a política do Supabase; cookies e parâmetros como `preview=1` não concedem acesso especial. Mídias privadas de rascunhos continuam inacessíveis mesmo na prévia local.

## Conectar o projeto Supabase existente

Nenhum projeto remoto foi criado, conectado ou alterado nesta etapa. URL, chave publicável e chave secreta do projeto existente escolhido pelo proprietário ainda precisam ser configuradas no servidor. Não use prefixo `NEXT_PUBLIC_` para essas variáveis.

1. Revise e aplique as migrations na ordem pelo fluxo de manutenção autorizado do projeto existente. Elas usam nomes `portfolio_*`.
2. A migration inicial conserva o histórico do esquema. A migration adicional `20261004011538_remove_portfolio_admin_access.sql` retira políticas, RPCs e grants administrativos, inclusive para contas anteriormente autorizadas. Ela não exclui tabelas, projetos, contatos, arquivos ou usuários.
3. A configuração final disponibiliza apenas leitura de conteúdo publicado para visitantes e contas comuns. A chave do servidor tem somente SELECT em metadados de mídia e INSERT em contatos dentro dessas tabelas. A aplicação não consulta mensagens recebidas.
4. Configure `PORTFOLIO_MODE=supabase`, `PORTFOLIO_SITE_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY` conforme `.env.example`.
5. Revise `supabase/seed.sql` antes de usar. Ele contém 56 trabalhos em rascunho e exige tabelas vazias; não sobrescreve conteúdo existente. O operador do projeto deverá confirmar conteúdo, trechos e publicação por um processo de manutenção externo ao site.
6. Confira os grants, execute os advisors e teste as consultas com visitantes e contas comuns no projeto remoto.

Sem configuração, o adapter retorna indisponibilidade, sem trocar silenciosamente para arquivos locais. Em produção, somente projetos publicados são retornados. As migrations remotas e os advisors não foram executados porque o projeto definitivo não está conectado. Revise também políticas adicionais de `storage.objects` do projeto existente: políticas permissivas de outras integrações podem ampliar acesso.

## Contato e mídia

O formulário exige Origin exata, corpo JSON com limite de tamanho, campos validados, campo anti-spam e limite de envio. A gravação é confirmada somente depois de persistir a mensagem. Não existe endpoint público para consultar contatos nem alterar projetos, artistas ou configurações.

O bucket `portfolio-media` continua privado. `/api/media/UUID` exige associação a um projeto publicado ou a uma configuração pública antes de consultar o arquivo. Conhecer a URL, enviar um cookie antigo ou usar o parâmetro de prévia não concede acesso. Arquivos soltos, de rascunhos ou de projetos arquivados permanecem privados.

No Supabase, uma referência autorizada recebe URL temporária de 60 segundos. Uma URL já emitida pode permanecer válida até expirar. No modo local, a reprodução mantém GET, HEAD e Range para avanço e retorno no vídeo. Não transfira arquivos privados para `public/`.

Não existem mais endpoints de envio de mídia pela aplicação. Arquivos existentes foram preservados; futuras alterações de conteúdo dependem de manutenção autorizada fora do site.

Os limites de frequência ficam na memória da instância. Em hospedagem com várias instâncias, adicione contagem distribuída no proxy ou armazenamento apropriado conforme o volume real. Configure `PORTFOLIO_TRUST_PROXY=true` apenas se o proxy substituir e proteger X-Forwarded-For. No ambiente Vercel, o contexto da plataforma é usado automaticamente.

## Backup

Pare o servidor antes de copiar `.local-data` para guardar dados e arquivos juntos. No projeto Supabase, mantenha backups do banco e do bucket. Remova objetos órfãos somente depois de conferir suas referências. A remoção da administração não apaga dados históricos nem afrouxa o acesso a rascunhos, contatos e mídia privada.

A seleção de conteúdo usa [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), e a reprodução privada segue [URLs temporárias de Storage](https://supabase.com/docs/guides/storage/serving/downloads).

## Verificação

`node src/lib/server/public.integration.mjs http://127.0.0.1:3100` verifica o servidor local real: ausência das páginas e APIs administrativas, consulta pública sem dados privados, bloqueio de escrita, Origin/Host, contato persistido e anti-spam, mídia privada de rascunhos, referência publicada e Range. O teste não usa login nem lê credenciais; remove somente as fixtures temporárias que criou.

Validações remotas de Supabase dependem da conexão do projeto existente e permanecem pendentes. O resultado dos testes locais e das verificações visuais é registrado em `docs/VERIFICACAO.md`.
