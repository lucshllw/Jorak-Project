# Fundo cartoon JORAK

Implementação baseada na proposta aprovada pelo usuário. A interface, tipografia Archivo, lettering, capas, coleção Three.js, poses do personagem e conteúdo foram preservados. A imagem de referência não é usada como página: o novo arquivo contém somente decoração.

## Composição e movimento

`ComicBackdrop` reúne três camadas: base escura, pinceladas laterais e recortes dos cantos. O mesmo ativo original é separado visualmente por máscaras. As áreas centrais permanecem calmas. Contato, índice e projetos recebem menor intensidade; Sobre mantém os recortes próximos do universo do personagem.

O cursor produz deslocamentos limitados (até 10,5 px). A rolagem desloca discretamente o plano de pinceladas. A troca de disco gera um único gesto com retorno ao repouso; tweens anteriores do mesmo elemento são cancelados. GSAP existente foi reaproveitado, sem novo motor de rolagem ou cena WebGL.

O player nativo e o YouTube sinalizam reprodução para reduzir a decoração e parar o movimento somente no contexto de projeto. As prévias da coleção não escurecem o fundo. Fechar um projeto restaura o estado da coleção. O diálogo usa entrada curta; as transições de rota reaproveitam o controlador com um recorte gráfico.

A base foi clareada para `#0D1C16`; o cabeçalho é transparente. Cada link do menu tem um balão de HQ verde escuro, contorno claro irregular, cauda, retícula lateral e sombra chapada, desenhado em `public/media/cartoon/menu-bubble.svg`. Hover e foco pelo teclado levantam o balão 2 px e suavemente endireitam seu contorno; movimento reduzido elimina a transição e o deslocamento. Recortes e pinceladas mantêm a intensidade original aprovada, preservando as áreas calmas atrás da leitura.

O tratamento neon anterior foi substituído pelos balões de HQ. Menu conferido em desktop e em 390 × 844, incluindo abertura no celular e foco pelo teclado. A prévia continua sem escurecer a coleção. Captura atual: `docs/screenshots/cartoon-menu-hq.jpg`.

Camadas decorativas não recebem foco ou eventos de ponteiro. Não existe loop de animação próprio. As animações são canceladas quando a aba fica oculta, o fundo sai da tela, um diálogo cobre a coleção ou movimento reduzido está ativo. O cursor só é usado com ponteiro fino; o celular mantém respostas de seleção e rolagem.

## Ativos

Arte original gerada com a ferramenta nativa de imagens. Prompt e proveniência: `public/media/cartoon/source.txt`. PNG original preservado; versão WebP de aproximadamente 180 KB utilizada na interface. Sem novas dependências.

## Verificação

Build de produção e TypeScript aprovados. Suíte existente: 28 testes aprovados, 2 testes de exportação real ignorados por ausência da configuração FFmpeg. Catálogo validado: 57 projetos e 57 capas.

No navegador: trocas consecutivas de disco, inversão, busca por Faminto, abertura de projeto pelo índice, reprodução nativa (estado de fundo confirmado), retorno com busca preservada, navegação mobile e contato. Layout inicial conferido em 390 × 844 sem overflow horizontal. Capturas em `docs/screenshots/cartoon-desktop.jpg` e `cartoon-mobile.jpg`.

Movimento reduzido foi implementado e revisado no código; não houve alteração das preferências do sistema para uma simulação real. Reprodução externa do YouTube e envio real do formulário não foram executados nesta verificação visual.
