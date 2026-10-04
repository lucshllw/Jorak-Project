# Verificação do catálogo e da experiência de mídia

**Registro da etapa anterior.** As contagens de zero arquivos próprios e nove players externos abaixo são históricas. A entrega atual possui 22 projetos nativos e está descrita em [MIDIAS-REAIS.md](MIDIAS-REAIS.md).

Etapa de 4 de outubro de 2026, na prévia local. Complementa e atualiza as contagens de `VERIFICACAO.md`. A administração continua removida e a conversa com personagem permanece adiada.

## Pesquisa aplicada

57 projetos com descrições completas dos originais lidas e crédito nominal de Jorak, incluindo **No topo do Campo**, do KMG GEEK, descoberto fora da playlist inicial. Há 49 artistas e os oito destaques aprovados foram preservados. A playlist informa uma entrada indisponível oculta; sem identificação pública, ela permanece pendente. A busca adicional teve escopo limitado aos canais e fontes descritos nos relatórios, sem afirmar exaustividade de toda a carreira.

As 57 capas foram decodificadas e possuem fonte registrada: 41 Spotify e 16 thumbnails originais. As 48 entradas antes sem capa foram preenchidas; o novo projeto também recebeu capa. As artes mantêm sua proporção ao serem enquadradas nos discos. Título e artista do lançamento foram conferidos antes de usar Spotify.

O catálogo registra um intervalo explícito de IMPERADOR (241–270 s), 23 intervalos com fim derivado do capítulo seguinte e 39 projetos sem intervalo individual identificado. A marcação `inferred` impede usar esses limites como autorização automática de corte. Coedição de Indie Cross e Renascer foi registrada por segmento. Timestamps de cantores de No topo do Campo não foram tratados como créditos de editores.

## Reprodução efetivamente observada

As nove comissões vinculadas ao canal do editor foram reproduzidas dentro das respectivas páginas do site: Mensageiro, IMPERADOR, Cara De Sorte, O Primeiro Rei, Carrasco, De Joelhos, América, Anomalia e Lampião de Espinhos. Foram observados frames carregados e avanço de tempo no elemento de vídeo externo; Carrasco chegou ao fim. O endereço do iframe é o upload correspondente de Jorak, sem aplicar tempos do lançamento original a esse upload. O link para o lançamento completo continua separado.

Essas nove fontes usam YouTube; título, canal e controles externos permanecem presentes. Nenhum arquivo de vídeo de Jorak foi obtido, exportado ou armazenado. **Recortes nativos reais disponíveis: zero.** Para os demais projetos, o player abre o original com informação honesta sobre a participação; conteúdo exclusivo para membros permanece indicado, sem incorporação ou tentativa de contornar o acesso.

O player próprio foi validado com uma fixture sintética de 20 segundos, criada localmente e identificada como teste. Foram observados: reprodução com duração correta e dados carregados, pause/play por K, seek por teclado, volume até zero, mute/unmute, tela cheia, recolhimento automático dos controles e descarte do vídeo ao voltar à coleção. A versão de prévia, com oito segundos e sem faixa de áudio, reproduziu com `muted=true`; somente um vídeo permanecia montado. Uma fixture separada com mídia ausente confirmou o aviso de falha, o botão Tentar novamente e o link original. As fixtures e referências de mídia foram removidas, retornando o catálogo a 57 projetos e zero arquivos de mídia referenciados.

## Interface e verificações

Computador em 1440×900 e celular em 390×844. Logo 3D ativa, oito destaques, filtro por Dino no projeto recém-adicionado, busca por No topo, prévias por teclado, botão para abrir o projeto, painel inferior dentro do índice, Tab/Shift+Tab, Escape, foco restaurado e ausência de rolagem horizontal foram conferidos. Corrigidos o descarte prematuro por rolagem ao abrir o painel, a reabertura por restauração de foco e a restauração do disco em links diretos à coleção completa. O balão de teclado agora acompanha sua âncora durante a rolagem suave, sem desaparecer; a posição e o fechamento foram conferidos no navegador. O atributo de rolagem recomendado pela documentação instalada do Next.js foi aplicado ao layout. A lógica de hover, tolerância de passagem ao balão, cancelamento durante arraste e reduced motion foi revisada no código; a ferramenta de navegador não oferece ação de hover isolado, portanto não se declara uma simulação completa desse gesto.

O teste HTTP executou 45 verificações com aprovação, incluindo rotas administrativas 404, escrita do catálogo recusada, mídia de rascunho/arquivada privada, prévia publicada com Range, validação de contato, Origin, Host e limite anti-spam. Fixtures e mensagens de teste foram removidas. O servidor foi reiniciado após esses testes para limpar o contador temporário de contato.

Os nove testes do pipeline passaram com FFmpeg/FFprobe real: autorização e limites, recusa de URLs e caminhos inválidos, preflight, não sobrescrita, hashes preservados, H.264/AAC, correspondência dos frames ao original sintético, proporção e prévia sem áudio de até oito segundos. A execução final passou os 12 testes, sem skips, incluindo três verificações dos limites do player e URLs, seguida da validação de todas as entradas, imagens e evidências. A descoberta dos executáveis foi movida para antes do registro dos testes, evitando uma limpeza antecipada dos diretórios temporários. `npm run typecheck` e `npm run build` passaram. O build mantém somente as rotas públicas documentadas, sem administração.

O build foi gerado com sucesso; a execução online não foi validada. O servidor de produção recusa o armazenamento local por segurança, e ainda falta configurar o Supabase existente. A prévia de desenvolvimento foi restabelecida na porta 3100. Os testes com FFmpeg e o build precisaram de execução fora da restrição de caminhos do Windows para resolver o diretório do projeto; nenhuma proteção do aplicativo foi desabilitada.

Capturas e provas temporárias de reprodução ficam em `research/verification/`, ignorado pelo Git. O código, catálogo, imagens de capa e documentos podem ser publicados; configuração privada, backups, executáveis, originais e recortes ficam fora dos commits.

## Pendências para produção

- Identificar o projeto Supabase existente escolhido e configurar as variáveis privadas no servidor; nenhuma organização/projeto foi criado ou alterado.
- Fornecer caminhos ou links de download autorizados dos arquivos de vídeo.
- Confirmar os 23 limites inferidos e os intervalos dos 39 projetos ainda sem minutagem, preservando a coedição.
- Revisar os recortes, enviar apresentação/prévia a armazenamento persistente privado e associar referências aos projetos publicados, mantendo as políticas de leitura e Range. O pipeline offline não publica automaticamente nem restaura administração.
- Identificar a entrada indisponível da playlist, se o editor tiver essa informação.

GitHub publica o progresso do código. Não equivale a uma hospedagem do site ou a uma validação de banco remoto.
