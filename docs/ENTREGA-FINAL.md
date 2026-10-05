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

Navegador: layouts em 320 × 640, 390 × 844 e 768 × 1024 sem overflow horizontal; FAQ e campos de 16 px conferidos. Emulação de largura não equivale a aparelhos reais nem testa o teclado virtual do sistema. Nenhum aparelho físico foi utilizado.

JJAURA mantém 25 publicados, 32 arquivados e 104 arquivos privados, totalizando 820.726.609 bytes. Credenciais e arquivos de trabalho permanecem fora do Git. A publicação usa Next.js com servidor e armazenamento persistente; não depende da pasta local ignorada.

## Publicação

Novo projeto Netlify em configuração. O endereço público e a verificação após a implantação serão registrados antes da entrega. A publicação beta permanece preservada.
