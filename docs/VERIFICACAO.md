# Verificação da versão pública

Registro histórico da etapa de 3 de outubro. A pesquisa, as contagens e a seleção de mídia foram atualizadas em [VERIFICACAO-MIDIA.md](VERIFICACAO-MIDIA.md); intervalos cujo término era derivado do capítulo seguinte agora permanecem pendentes de confirmação.

Validação realizada em 3 de outubro de 2026, no ambiente local. Esta versão não inclui administração nem conversa com personagem; a conversa foi adiada pelo proprietário.

## Verificações automatizadas executadas

- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, incluindo a verificação de tipos integrada ao Next.js. A lista final de rotas contém `/`, `/sobre`, `/contato`, `/projeto/[slug]`, `/api/portfolio`, `/api/contact`, `/api/media/[id]` e as rotas internas de erro/ícone. Não contém rotas administrativas.
- `node src/lib/server/public.integration.mjs http://127.0.0.1:3100`: 43 verificações aprovadas contra o servidor real.
- `git diff --check`: aprovado. Arquivos privados, dependências, build, dados locais e caches foram conferidos como ignorados pelo Git; a revisão de arquivos candidatos não encontrou credenciais.

O teste de integração conferiu as antigas páginas e APIs administrativas, tanto GET como POST, com resposta 404; consulta pública sem informação privada; escrita no catálogo recusada; ausência de acesso público à caixa de contatos; `preview=1` sem autenticação ou privilégio; projeto inexistente com 404; mídia sem referência, de rascunho ou arquivada com 404; mídia publicada com GET, HEAD e Range; validação de campos, Origin, Host, formato e tamanho do corpo; campo anti-spam e limite de contato; envio válido com 201 e confirmação da gravação persistida.

As fixtures criadas pelo teste foram removidas. Os projetos existentes foram preservados. O servidor foi reiniciado após testar o limite de contato, limpando somente o contador temporário em memória.

## Conferência visual e interação

| Fluxo | Resultado observado |
| --- | --- |
| Computador e celular | Interface conferida em 1440 × 900 e 390 × 844; sem rolagem horizontal. Menu móvel abre, fecha e navega para Sobre e Contato. |
| Identidade | Marca branca pequena no cabeçalho; avatar atualizado; interface em verde esmeralda; um único lettering grande no espaço principal. |
| Logo 3D | Canvas ativo com geometria extrudada, contorno branco físico, materiais, iluminação, chanfros e sombra. PNG original disponível como fallback. |
| Animação | Entrada frontal, flutuação e resposta ao cursor implementadas. Pausa da logo ao abrir o índice confirmada no navegador. Limites de resolução/frequência e limpeza dos recursos revistos no código. |
| Coleção | Oito destaques presentes; catálogo com 56 trabalhos; filtros por artista; índice com busca e estado vazio. Ranori retorna Carrasco e América; oShaman retorna Convidado Especial. |
| Reprodução | Segundo trecho de Convidado Especial abre o player oficial com início em 195 s e fim em 207 s. Voltar à coleção remove o iframe, interrompendo sua reprodução. |
| Páginas | Sobre mantém biografia, carreira e links; Contato mantém campos, aviso de uso dos dados e links profissionais. |
| Administração | Nenhum link administrativo na interface. Páginas e APIs removidas confirmadas pelo teste e pela lista de rotas compiladas. |

Os perfis da logo possuem 17 formas e 8 furos, com coordenadas válidas e proporções preservadas. A suavização subpixel foi auditada contra o contorno de origem, com desvio conservador abaixo de 0,75 pixel; as métricas estão em `docs/LOGO-3D.md`.

`prefers-reduced-motion`, mudança de preferência, pausa fora da área visível, pausa com documento oculto e fallback de WebGL foram revistos na implementação. Não foi alterada a preferência de acessibilidade do sistema do usuário para simular essas condições. A navegação direta por URL foi conferida; não se declara uma validação completa do histórico avançar/voltar do navegador.

As capturas locais de verificação ficam em `research/verification/`, fora dos commits. Um aviso de precisão numérica do compilador de shaders do navegador apareceu sem impedir a renderização; a compilação de produção foi aprovada.

## Limitações e próximas configurações

- O projeto Supabase definitivo ainda não está conectado. URL e chaves precisam ser configuradas no servidor; as migrations, os grants, as políticas de Storage e os advisors precisam ser conferidos no projeto remoto existente. A revogação administrativa foi preparada em migration adicional, sem excluir dados.
- A prévia local permite consultar os rascunhos pesquisados. Em produção, somente trabalhos publicados serão apresentados; o conteúdo deve ser revisado e publicado por manutenção autorizada fora do site.
- O envio ao GitHub publica o código. Hospedagem online e validação do banco remoto não fazem parte desta publicação.
- A conversa com personagem será implementada posteriormente, conforme decisão do proprietário.

O workflow do GitHub executa instalação limpa, verificação de tipos e build em novos pushes para `main` e em pull requests. Seu resultado remoto deve ser acompanhado após a publicação; não se confunde a configuração do workflow com uma execução aprovada.
