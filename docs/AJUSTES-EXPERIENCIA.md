# Ajustes de experiência — JORAK

Entrega local de 4 de outubro de 2026. O código público inclui recursos gráficos leves e evidências. Vídeos, dados de contato, originais de pesquisa, dependências e configuração privada continuam fora do Git.

## Integrado

- Índice aprovado preservado, com personagem ao lado do fechamento. Busca, filtros e dimensões continuam iguais.
- 16 thumbnails do YouTube obtidas na melhor resolução realmente disponível. ZERØ usa 640 × 361, recortado do original de 640 × 480 sem ampliar; maxres não estava disponível. Trucido remove somente uma borda externa de dois pixels. Fontes, hashes e enquadramentos ficam em `data/artwork.json`; 41 capas Spotify permanecem iguais.
- Círculos 3D mantêm proporção da arte e enquadramento consistente com índice e lista.
- Intro somente no recarregamento do documento inicial da home, com foco em pular, Escape, bloqueio da coleção, sem prévias/vídeos/FAQ. Não reaparece em retorno interno. Botão de replay removido. Links sem JavaScript ficam fora do bloqueio.
- Um Lenis global, integrado ao ticker GSAP e ScrollTrigger. Profundidade da galeria separada de arraste/seleção, sem pin longo. Ambiente verde azulado nas músicas e transições curtas com variações. Recursos são limpos ao trocar de página e respeitam movimento reduzido.
- Uma seção “Minha Edição ao Projeto” e um player nativo por projeto. Partes originais confirmadas têm prioridade e ordem; comissões duplicadas não são repetidas. Sem recorte próprio, há somente link para o original. Poster real, proporção preservada, play central, controles recolhidos após inatividade, créditos fora da imagem.
- Descrições padronizadas dos 57 projetos em primeira pessoa. Créditos completos e coedição preservados; evidências e incertezas ficam no relatório de manutenção.
- Personagem fornecido com alpha real, incluindo remoção do quadriculado entre as pernas. O original fica em `public/media/character/jorak-reference-original.png`, a versão limpa em `jorak-standing.png`. Integração responsiva na home, junto ao X do índice, ao avatar do Sobre e ao formulário. O personagem e o FAQ ficam ocultos em prévias e projetos.
- FAQ somente na home, inclusive modo lista: sugestões, pergunta, estado de espera, erro e fechamento. Campo limitado, origem validada e limite de requisições; nenhum endpoint administrativo ou upload público foi criado.

## IA e poses: limite concreto

O FAQ usa opcionalmente **gpt-4.1-mini**, pela Responses API da OpenAI, para classificar a pergunta em um tópico aprovado. O servidor devolve uma resposta cadastrada; o modelo não cria preços, prazos, disponibilidade ou links. `store: false`, saída estruturada, timeout de nove segundos e pausa temporária após falha do provedor. Não usa conteúdo privado do formulário.

Documentação: [modelo](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [saída estruturada](https://developers.openai.com/api/docs/guides/structured-outputs).

A tentativa autorizada de produzir poses com **gpt-image-2** retornou `insufficient_quota`. Nenhuma pose adicional foi gerada. O personagem atual é a ilustração em pé, com entrada e respiração discreta. Sentado, apontando, queda/aterrissagem desenhadas, encostado, expressão apaixonada, piscadas e movimentos reais da cabeça continuam pendentes de crédito disponível na API ou sprites fornecidos. Rotacionar a imagem em pé não foi apresentado como uma dessas poses.

A chave privada foi configurada somente em `.env.local`, ignorado pelo Git. O FAQ registrado permanece disponível quando a chave está ausente, revogada ou sem cota. Não houve confirmação de resposta bem-sucedida do provedor pago nesta conta.

## Pesquisa e mídias

22 projetos com arquivos reproduzíveis (21 edições e um trailer), 22 discos com prévia, 23 arquivos de apresentação e seus derivados preservados. A galeria não carrega vídeos ao abrir a home. O trailer de Herói do Japão continua identificado como trailer.

35 trabalhos não possuem edição própria porque ainda faltam limites individuais comprovados ou material acessível. Os 34 originais públicos pendentes foram baixados somente para pesquisa: amostras da abertura, encerramento e transições não confirmaram novos limites. Um original permanece exclusivo para membros. Consultar [PENDENCIAS-PARA-JORAK.md](PENDENCIAS-PARA-JORAK.md), que inclui créditos encontrados e perguntas específicas.

## Manutenção e produção

Atualizar `data/catalog.json`, gerar catálogo e SQL com `npm run catalog:generate`, sincronizar metadados locais com `node scripts/sync-local-catalog.mjs --apply` e atualizar relatório com `node scripts/report-portfolio.mjs`. Para vídeos, usar o plano revisado em `data/media-sources.json` e o processo de `RECORTES-OFFLINE.md`. Não inserir URLs próprias fictícias nem promover `inferred` a `explicit` sem evidência.

Ainda falta escolher o projeto Supabase existente, configurar hospedagem, enviar os vídeos/derivados ao armazenamento privado e associar referências aos projetos publicados. Não aplicar seed de banco vazio sobre dados existentes. Nenhum banco remoto foi alterado. GitHub publica o código; a experiência com os arquivos preparados está no ambiente local.

## Remover a chave

1. Abrir [API keys da OpenAI](https://platform.openai.com/api-keys), identificar a chave usada e selecionar **Revoke**. Isso invalida a credencial que foi compartilhada.
2. No arquivo privado `.env.local`, remover a linha `OPENAI_API_KEY=...`; não copiar seu valor para outro arquivo ou commit.
3. Reiniciar o servidor local. Se a chave tiver sido configurada em uma hospedagem, removê-la também das variáveis do servidor e republicar.

Revogar é diferente de apagar o arquivo local: a revogação impede uso da credencial em qualquer outro lugar. Para retomar IA no futuro, criar outra chave e inseri-la diretamente na configuração privada, sem enviar no chat.
