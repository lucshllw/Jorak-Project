import fs from 'node:fs/promises';
const audit = JSON.parse(await fs.readFile('data/media-audit.json', 'utf8'));
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const lines = ['# Pendências para consultar Jorak', '',
  'Atualizado em 4 de outubro de 2026. Há 35 projetos sem arquivo próprio reproduzível. Crédito nominal comprova participação; um capítulo seguinte não comprova o fim da edição.', '',
  'Foram relidas as descrições públicas de 56 originais e preservado o registro anterior do original exclusivo para membros. Foram consultados capítulos, até 60 comentários por vídeo (incluindo os fixados recuperados), uploads próprios e publicações acessíveis no X. Nos 34 originais públicos ainda pendentes, abertura, encerramento e transições de capítulos foram examinados em amostras visuais; isso não equivale a assistir integralmente a todos os vídeos nem comprova limites por aparência.', '',
  'Para cada item, informe início e fim de todas as partes no lançamento original, incluindo coedição. Alternativamente, forneça um arquivo autorizado que contenha exclusivamente sua contribuição. O tempo de uma comissão própria começa em zero e não deve ser copiado para a linha do tempo do original.', ''];
function item(project, reason) {
  lines.push(`## ${project.title} — ${project.artists.join(' / ')}`, '',
    `[Lançamento original](${project.originalUrl})`, '', 'Crédito registrado:', '',
    ...String(project.creditFound || 'Crédito anteriormente registrado no catálogo; consultar a fonte.').split('\n').map(line => `> ${line}`), '',
    `Falta: ${reason}`, '');
}
for (const project of audit.projects.filter(p => !p.nativeAssetIds.length)) item(project, project.pendingReason);
lines.push('## Limites do original em projetos que já têm apresentação própria', '',
  'Os 22 projetos com arquivos locais não significam 22 intervalos identificados no lançamento. IMPERADOR tem 04:01–04:30 explícito e é preferido no player. As demais apresentações usam o upload próprio comprovado, com linha do tempo separada.', '');
for (const project of audit.projects.filter(p => p.nativeAssetIds.length && !p.originalRanges.some(r => r.rangeStatus === 'explicit'))) {
  const inferred = project.originalRanges.filter(r => r.rangeStatus === 'inferred');
  const reason = project.trailerOnly ? 'Há somente o trailer próprio. Fornecer a edição da música ou confirmar início/fim no lançamento.' : inferred.length
    ? `Confirmar o fim das partes com início registrado em ${inferred.map(r => clock(r.start)).join(', ')}. Os limites do capítulo seguinte permanecem inferidos.`
    : 'Confirmar a correspondência e os limites no lançamento, caso queira substituir a apresentação própria pela montagem final.';
  item(project, reason);
}
lines.push('## Fontes não identificadas', '', 'Nove entradas privadas da playlist COMISSÕES e uma entrada oculta do catálogo não possuem identidade pública suficiente. Duas comissões públicas de Yuta/KMG e Barou/Mathover ficam fora dos 57 projetos e não foram adicionadas por suposição.', '',
  'Dados detalhados: `data/media-audit.json`. Este relatório é gerado por `node scripts/report-portfolio.mjs` e não altera mídias ou banco remoto.', '');
await fs.writeFile('docs/PENDENCIAS-PARA-JORAK.md', lines.join('\n'));
console.log(`Relatório: ${audit.projects.filter(p => !p.nativeAssetIds.length).length} projetos sem mídia própria.`);
