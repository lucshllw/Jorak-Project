# Entrega final JORAK

## Conteúdo e comportamento

25 trabalhos públicos com recortes reproduzíveis e prévias silenciosas; 32 registros arquivados, sem exclusão de fontes ou arquivos. O catálogo comercial mantém 14 produtos, inclusive as thumbnails de Simo Hayha, Uruma e Estarossa.

| Trabalho | Intervalo confirmado pelo cliente |
| --- | --- |
| TRAIÇÃO DE SANGUE — Igris | 178–206 s |
| GOLS E TRAVESSURAS — Neko | 44–72 s |
| SOU DEUS — 7 Minutoz | 148–158 s |

Os quadros de entrada e saída foram comparados com os originais. TRAIÇÃO DE SANGUE tem quadros pretos nos limites também no original; o conteúdo intermediário foi conferido. SOU DEUS mantém o limite solicitado de 2:38, com a divergência de 2:36 na descrição do original registrada internamente. Sua capa é o anexo de 300 × 300 pixels fornecido pelo cliente, sem ampliação, identificado corretamente como upload.

FAQ responde perguntas específicas e permanece acessível durante as prévias. Conversas abertas impedem novos disparos por hover. Prévias compactas, sem balão, com inclinação limitada a 4 graus, fechamento acessível e alternativas para toque e movimento reduzido. A linha visível de links “Ver prévia” foi removida, preservando acesso pelo teclado.

## Medições

26 clipes principais: 1.313.284.433 → 492.702.101 bytes (62,5% menores), preservando as trilhas AAC sem nova compressão. 25 capas: 4.409.730 → 2.175.986 bytes (50,7% menores). Os arquivos originais foram preservados.

HTTP local em desenvolvimento, mesmo endereço e procedimento: aquecimento e cinco amostras, mediana. Home: 140 → 78 ms; API do catálogo: 98 → 25 ms. HTML: 189.942 → 130.091 bytes; JSON: 132.572 → 78.505 bytes. São medições locais, não pontuações Lighthouse nem previsão de rede pública. A seleção menor também contribui para esses resultados.

Componentes de FAQ, prévia e projeto carregam sob demanda. Uma prévia por vez; vídeos e animações pausam com a aba oculta. Galeria libera materiais antigos e limita a resolução em dispositivos com menos recursos. Uma instância de Lenis; ticker suspenso quando desnecessário. Encerramentos celestiais preservados.

## Verificação

Build Next.js 16.3.8 aprovado. 31 testes passaram sem skips, incluindo exportação real, áudio e prévias. 74 verificações de contexto, FAQ e solicitações; 55 de APIs públicas. Conferência HTTP de 25 trabalhos, 104 URLs de mídia, 13 solicitações pagas e um download gratuito. Produção local conectada ao JJAURA respondeu às três perguntas da home, com proteção de origem mantida.

Navegador: layouts em 320 × 640, 390 × 844, 768 × 1024 e 844 × 390 sem overflow horizontal; FAQ e campos de 16 px conferidos. Player de SOU DEUS, encerramento celestial, repetição e histórico voltar/avançar conferidos. Emulação de largura não equivale a aparelhos reais nem testa o teclado virtual do sistema. Nenhum aparelho físico foi utilizado. A indisponibilidade de WebGL e a troca da preferência do sistema não foram simuladas no navegador disponível; as alternativas foram revisadas no código. Um erro isolado de MutationObserver apareceu na primeira abertura pública, sem origem indicada pela ferramenta, e não se repetiu ao recarregar; não foi possível atribuí-lo conclusivamente.

JJAURA mantém 25 publicados, 32 arquivados e 104 arquivos privados, totalizando 820.726.609 bytes. Credenciais e arquivos de trabalho permanecem fora do Git. A publicação usa Next.js com servidor e armazenamento persistente; não depende da pasta local ignorada.

## Publicação

Endereço público atual: https://jorakeditor.netlify.app/ . Projeto conectado à branch `codex/portfolio-finalizacao`, Next.js Runtime 5.16.1, com função de servidor e variáveis privadas restritas à produção. Usa o modo Supabase padrão de produção, inclusive nos metadados de indexação. `PORTFOLIO_PUBLIC_ORIGIN` contém o endereço público como configuração comum; o nome anterior da variável continua aceito para compatibilidade local. Após a renomeação do projeto Netlify, essa configuração foi atualizada para o novo endereço: a divergência causava recusa 403 no FAQ. O teste de origem inclui as três perguntas sugeridas do índice, além da home e da recusa de origens externas ou ausentes. Os campos antigos classificados como segredo ficaram sem valor, e a chave do banco continua protegida. A varredura de credenciais permanece habilitada. A publicação beta permanece preservada.

Atualização de contato e entrada: os 13 arquivos pagos abrem primeiro a página dedicada com capa, preço, compatibilidade e campos de nome, e-mail e mensagem. O botão final prepara um e-mail para o endereço cadastrado do Jorak, com os dados de contato e as informações canônicas do produto. O cliente precisa enviar no próprio aplicativo. O download gratuito permanece intacto e o FAQ acompanha esse fluxo. Vamos criar salva os pedidos no servidor e devolve ao navegador o aviso com os dados validados e o destinatário cadastrado, para encaminhamento pela integração AJAX do FormSubmit. O desenvolvimento local e a opção de pausa não devolvem instruções de envio real. O usuário apresentou a captura do e-mail de teste recebido após a ativação do serviço; o encaminhamento pelo servidor da hospedagem foi recusado com HTTP 403, por isso o fluxo foi ajustado para o envio pelo navegador documentado pelo provedor. Aceite pelo serviço, sozinho, não comprova chegada à caixa de entrada. Falhas preservam o pedido salvo, são registradas sem conteúdo pessoal nos logs e não provocam reenvios automáticos. Desenvolvimento local não envia e-mails reais; PORTFOLIO_EMAIL_NOTIFICATIONS=disabled pausa os avisos em produção.

A introdução deixou de depender do tipo reload e de uma trava global. Agora inicia a cada montagem da home, inclusive acesso direto, nova guia e F5; a preferência por movimento reduzido continua respeitada. A verificação automatizada cobre entradas navigate/reload/back_forward, os dois produtos Kaiser com preços distintos, respostas atualizadas do FAQ e envio/rejeição/timeout/ativação do serviço de e-mail.

Verificação no endereço público: oito rotas principais e de solicitação responderam 200; os três projetos, clipes, prévias e posters responderam corretamente, incluindo Range 206. Os três trabalhos arquivados responderam 404. As três perguntas da home retornaram respostas, e origem externa foi recusada. Contato geral e interesse no Simo Hayha gravaram dois registros identificados de teste no JJAURA, conferidos no banco e removidos por seus IDs exatos após a validação. O selo opcional do Netlify foi desativado porque cobria o campo do FAQ.
