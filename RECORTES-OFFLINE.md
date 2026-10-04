# Recortes de edição, a partir de arquivos autorizados

`scripts/prepare-clips.mjs` prepara os arquivos de apresentação e de prévia fora do site. Ele usa somente vídeos locais com autorização e limites confirmados. Não baixa vídeos, não envia arquivos, não escreve no banco e não oferece acesso administrativo.

Os arquivos reais já preparados e as pendências estão em [docs/MIDIAS-REAIS.md](docs/MIDIAS-REAIS.md). Um horário obtido pelo início do próximo crédito é uma inferência: precisa de confirmação do fim antes de exportar. O teste sintético não representa um projeto do JORAK.

## Obter as fontes públicas revisadas

`scripts/acquire-portfolio-media.mjs` complementa o processamento offline: usa `data/media-sources.json`, com fontes autorizadas, canal/autor esperado e comprovação. Aceita somente links canônicos do YouTube e posts públicos de @Jorakeditor; não usa cookies, login nem acesso a uploads privados. Recusa limites inferidos. O identificador do vídeo no X pode diferir do identificador do post; a associação é conferida pelos metadados da fonte e pelo autor.

Instale yt-dlp de [seu repositório oficial](https://github.com/yt-dlp/yt-dlp#installation), verificando o checksum publicado. A preparação realizada usou yt-dlp 2026.08.19 e FFmpeg/FFprobe 9.0.2. Os executáveis ficam em `.tools/`, fora do Git. Com Node e as ferramentas no PATH:

```powershell
npm run media:prepare
npm run media:prepare -- --execute --import-local
```

Para os executáveis portáteis instalados neste computador:

```powershell
node scripts/acquire-portfolio-media.mjs --execute --import-local --yt-dlp .tools/yt-dlp/yt-dlp.exe --ffmpeg .tools/ffmpeg/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe --ffprobe .tools/ffmpeg/ffmpeg-9.0.2-essentials_build/bin/ffprobe.exe
```

O modo padrão somente mostra o plano. `--execute` baixa fontes possíveis, mede a duração real, exporta e decodifica os arquivos para validação, verifica áudio não silencioso, proporção e hashes. Produz `presentation.mp4`, `mobile.mp4` (até 720p, com áudio), `preview.mp4` (até oito segundos e 480 pixels, sem áudio), `poster.jpg` (quadro revisado da edição) e `export.json`. A prévia começa depois da vinheta inicial quando possível. Nunca altera os originais. Um upload próprio usa 0 até a duração medida de sua própria linha do tempo; não recebe os horários do lançamento original.

`--import-local` exige `PORTFOLIO_MODE=local` e importa somente os projetos já cadastrados, preservando mensagens e configurações, com trava, backup privado e atualização atômica. Os projetos com arquivo passam a publicados **somente no armazenamento local**, pois a API continua recusando mídias de rascunhos. Nenhuma variável, banco ou política remota é alterada. O seed do Git continua em rascunho e não contém URLs locais de mídia.

Exports existentes são reaproveitados somente após conferir hashes e fonte. O import é idempotente quando os arquivos não mudam. `--refresh-assets` regenera explicitamente somente quadro/prévia; a apresentação permanece intacta. O relatório privado `.local-data/media-export-report.json` informa falhas por projeto e só arquivos validados são associados. As evidências sanitizadas em `data/media-assets.json` registram o lote efetivamente preparado; não são um comando de publicação.

Finalize a importação antes de testar no navegador e recarregue as abas. Uma troca de referências invalida URLs antigas que deixaram de estar associadas a projetos publicados; isso preserva a proteção do serviço de mídia.

## Preparação

Instale FFmpeg e FFprobe a partir de um fornecedor indicado em [ffmpeg.org](https://ffmpeg.org/download.html), verificando o checksum publicado. Os executáveis podem ficar em `.tools/`, que está fora do Git. O script não instala nada e não exige bibliotecas adicionais do Node.

Defina `FFMPEG_PATH` e `FFPROBE_PATH` com os caminhos locais ou informe `--ffmpeg` e `--ffprobe`. Sem essas opções, os nomes `ffmpeg` e `ffprobe` são procurados no PATH. Execute os comandos a partir da raiz do projeto.

Salve o manifesto privado em `.local-data/clip-inputs.json`, também fora do Git. Cada participação contínua precisa de um item separado. `input` pode ser absoluto ou relativo à pasta do manifesto. URLs, playlists, protocolos e compartilhamentos de rede são recusados.

```json
{
  "version": 1,
  "clips": [
    {
      "projectSlug": "projeto-exemplo",
      "segmentId": "parte-01",
      "input": "originais/projeto-exemplo.mp4",
      "start": 12.5,
      "end": 26.0,
      "authorized": true,
      "rangeConfirmed": true,
      "evidence": "Exemplo fictício. Substituir pela autorização e confirmação reais do editor.",
      "sourceUrl": "https://example.com/projeto-exemplo"
    }
  ]
}
```

Use `authorized: true` apenas após obter autorização para usar o arquivo. Use `rangeConfirmed: true` apenas após confirmar que todo o intervalo corresponde à participação descrita. O manifesto declara essas condições; o script não substitui a confirmação do responsável. Não use os números fictícios do exemplo em projetos reais.

## Validar e exportar

```powershell
node scripts/prepare-clips.mjs --manifest .local-data/clip-inputs.json
node scripts/prepare-clips.mjs --manifest .local-data/clip-inputs.json --execute
```

O primeiro comando apenas inspeciona os arquivos com FFprobe e imprime o plano. Não cria os diretórios de saída. Todos os itens são validados antes de começar uma exportação: IDs, duplicações, confirmação, existência dos originais e duração de cada intervalo.

O segundo cria `.local-data/clips/<projectSlug>/<segmentId>/` com:

- `presentation.mp4`: somente o intervalo confirmado, H.264 com qualidade CRF 18 e áudio AAC de 192 kb/s quando o original contém áudio. Preserva o enquadramento e não amplia a resolução. Dimensões ímpares são reduzidas em no máximo um pixel para a compatibilidade do codec.
- `preview.mp4`: os primeiros até oito segundos do recorte, sem áudio, com largura e altura de até 480 pixels, proporção preservada e até 24 quadros por segundo. Nunca amplia o vídeo.
- `export.json`: identificação, evidência, tempos originais, metadados, tamanho e SHA-256 do original e dos dois arquivos. A publicação fica marcada como `not-uploaded`.

As duas versões usam `faststart` para começar a reprodução sem aguardar o download completo. Originais sem áudio continuam sem áudio. Nenhum arquivo original é alterado; o hash é conferido novamente após a exportação.

Nenhum destino existente é sobrescrito. Para um novo lote, use, por exemplo, `--output .local-data/clips/lote-02`. A saída deve continuar dentro de `.local-data/clips`; caminhos que escapem dessa pasta ou passem por links simbólicos são recusados. Não use a pasta de exportação para guardar os originais.

Se uma ferramenta falhar durante a conversão, o diretório daquele item permanece com `failed.json` e possíveis arquivos `.partial.mp4`, para diagnóstico. Os itens já finalizados continuam intactos; os seguintes não são executados. Revise a falha e exporte os itens restantes em outro lote. Somente arquivos sem `partial` e com `export.json` válido devem seguir para revisão.

## Revisar e colocar em produção

Confira a imagem, o áudio e os limites com o editor antes de publicar. A tolerância de duração do codec é de dois quadros ou 0,12 segundo, o que for maior; isso não autoriza conteúdo fora da participação confirmada. Para cortes muito curtos, confirme também o limite de quadro no arquivo final.

O envio ao armazenamento definitivo é uma etapa separada, pendente da escolha e configuração do projeto. Os arquivos precisam de referências persistentes no catálogo, acesso compatível com projetos publicados e suporte a requisições de intervalo para o player. Não adicione vídeos, originais, relatórios privados ou chaves ao Git. A estrutura `.local-data/` e `.tools/` já está ignorada. O script não reintroduz login, upload público ou rotas de administração.

## Testes

```powershell
node --test scripts/prepare-clips.test.mjs
```

Os testes verificam autorização, limites, travessia de caminhos, duplicações, URLs recusadas e proporções. Com FFmpeg/FFprobe disponíveis, também geram vídeos sintéticos com áudio, exportam intervalos reais, comparam os quadros do recorte com o intervalo original, inspecionam codecs e durações e verificam que a prévia não tem áudio, termina em oito segundos para o recorte longo e que o original e os arquivos existentes permanecem intactos. Sem os executáveis, os dois testes de conversão são marcados como não executados.

Para manter esse material sintético somente durante uma verificação local do player, defina `KEEP_CLIP_FIXTURE=1` antes de rodar os testes. Os caminhos preservados aparecem no resultado. Remova a referência temporária do catálogo e os arquivos após a verificação; eles não contam como recortes reais disponíveis.
