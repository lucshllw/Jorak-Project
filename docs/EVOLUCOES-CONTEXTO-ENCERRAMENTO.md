# FAQ, solicitações e moldura celestial — 04/10/2026

Base: main, 1ca9414. Briefing 50f74d5d-d3dd-4846-8dfc-4ce4e051c062 e ajustes posteriores do cliente.

## Entrega
- FAQ no personagem das sete páginas: início, índice, Sobre mim, Projetos de edição, Surface Academy, contato geral e solicitação de produto. Sugestões específicas, histórico limitado às últimas seis perguntas, respostas por intenção concreta, cancelamento ao navegar e foco/teclado. Campos dos formulários não são lidos nem enviados à conversa. A IA existente apenas classifica tópicos desconhecidos; fatos, preços e links vêm de fontes cadastradas.
- Treze rotas dedicadas para arquivos pagos. Produto e preço são canônicos no servidor; somente nome, e-mail e mensagem são preenchidos. Cristino continua no Drive gratuito. Contato geral preservado.
- Encerramento compartilhado no player principal: término nativo real ou evento oficial do YouTube após reprodução. Não é instalado nas prévias em loop. Arquivos próprios usam vídeo nativo; obras pendentes só oferecem o lançamento completo claramente identificado.
- Peça circular com geometria extrudada, coroa e moldura simétrica. Entrada com escala/inclinação e aura por 2,5 segundos; saída suave antes de repetir desde o início. Apenas modo celestial, sem seletor de modo ou repetição automática.
- Verso com o ícone original do Jorak enviado pelo cliente, sem logos de plataformas. A imagem anexada mais recente tem SHA256 idêntico a public/media/jorak-avatar-original.png; foi reutilizada integralmente.
- Arraste horizontal no espaço inteiro da apresentação, com captura do ponteiro para continuar fora do alvo. Uma interação manual pausa o giro automático; Retomar rotação volta do mesmo ângulo. Setas do teclado também giram. Toque vertical mantém rolagem.
- Links recolhidos, abertos por clique no ícone do verso ou botão acessível. Publicação própria do Jorak quando cadastrada, lançamento original nos demais e Spotify quando disponível. Links de publicações no X são identificados como publicação, sem chamá-los de canal do YouTube.
- Canal do Jorak adicionado a Sobre mim: https://www.youtube.com/channel/UCF-jHvQ-q1N-zLheeUQRVcw. Evidência já registrada em CATALOGO-AUDIT-B.md.
- Cena sob demanda, um ticker GSAP, resolução e geometria limitadas no celular, pausa fora da tela/aba oculta, descarte de recursos e alternativa estática em movimento reduzido/falha de WebGL.

## Verificação
- npm test: 28 testes passaram, dois testes de exportação FFmpeg ignorados por falta das variáveis de caminho no processo de teste. Nenhum download ou recorte novo nesta tarefa.
- Verificação HTTP local: 74 verificações, sete contextos, 13 rotas pagas, envio/persistência canônica e recusas de preço adulterado, origem inválida e contexto privado. Dados de teste removidos.
- Integração pública existente: 55 verificações passaram, incluindo armazenamento, Range de mídia, origem e ausência de administração.
- TypeScript e build de produção verificados.
- Navegador: reprodução nativa real de Faminto (20,032 s), Imperador e Anomalia (21,504 s), encerramento por evento real; replay de Faminto observado no início (0,104 s, reproduzindo), aura ativa na entrada e ausente após a animação, pausa/setas e abertura dos links por clique real no verso.
- FAQ: contextos testados em navegador; três perguntas sobre Kaiser/Fokes geram respostas específicas e preço R$100 (não o Kaiser/M4rkim de R$150); navegação limpa a conversa; Escape fecha apenas o FAQ no índice.
- Capturas locais em .local-data/verification, fora dos commits.
- Os testes de navegador comparam telas de computador e celular; não substituem uma sessão física em dispositivo touch ou uma falha forçada de WebGL. As alternativas de movimento reduzido e erro foram revisadas no código.

## Cobertura e publicação
Catálogo preservado: 57 trabalhos, 22 com arquivo próprio reproduzível e 34 elegíveis para tentativa de reprodução do lançamento original via YouTube; um disponível apenas por link externo. Elegibilidade não garante que a plataforma autorize cada incorporação.
As 35 obras sem arquivo próprio mantêm sua situação cadastrada; não foram criadas minutagens presumidas. Disponibilidade, bloqueios e limites pendentes continuam descritos nos relatórios anteriores de mídia.

Código autorizado para GitHub/main. Nenhum fluxo de hospedagem da beta encontrado; push do código não equivale a implantação. As mídias continuam locais; produção exige configurar armazenamento persistente/Supabase existente e transferir os arquivos. O modo local é deliberadamente recusado em NODE_ENV=production.

Skills usadas: frontend-design, threejs, GSAP/motion e performance, instruções Next.js locais, verificação e diagnóstico Superpowers. Sem geração de imagem, serviço pago novo, plugins adicionais ou mudança de esquema Supabase.

Verificação HTTP isolada: usar JORAK_VERIFY_INSTANCE=true, PORTFOLIO_TRUST_PROXY=true e PORTFOLIO_SITE_ORIGIN=http://127.0.0.1:3101 apenas no processo local de teste. .next-verification está ignorado. Não habilitar confiança em proxy sem uma infraestrutura confiável em produção.
