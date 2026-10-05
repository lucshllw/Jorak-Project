import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function validateCatalog(catalog) {
  const { projects, artists } = catalog.portfolio;
  for (const field of ['id','slug','youtubeUrl']) assert.equal(new Set(projects.map(p => p[field])).size, projects.length, `Projetos duplicados: ${field}`);
  const ids = new Set(artists.map(a => a.id));
  assert.equal(ids.size, artists.length, 'Artistas duplicados');
  assert.equal(projects.filter(p => p.featured).length, 8, 'Preservar os oito destaques aprovados');
  assert.equal(catalog.provenance.length, projects.length, 'Uma auditoria por projeto');
  for (const p of projects) {
    const evidence = catalog.provenance.find(e => e.slug === p.slug);
    assert.ok(evidence?.descriptionRead && evidence.creditConfirmed && evidence.sourceUrl === p.youtubeUrl, `Crédito sem fonte: ${p.slug}`);
    assert.ok(p.artistIds.length && p.artistIds.every(id => ids.has(id)), `Artista desconhecido: ${p.slug}`);
    assert.ok(p.creditSource && p.checkedAt && p.participation && p.credits, `Metadados incompletos: ${p.slug}`);
    if (p.editShowcaseUrl) {
      assert.equal(evidence.showcase.url,p.editShowcaseUrl,'Upload próprio precisa de fonte correspondente');
      assert.ok(evidence.showcase.identitySource && evidence.showcase.correspondenceEvidence,'Vínculo do canal e do original precisam estar documentados');
      if(p.tools.length)assert.ok(p.toolsSource,'Ferramentas do upload têm fonte específica');
    }
    assert.match(p.coverUrl, /^\/media\/covers\/[a-z0-9-]+\.jpg$/, `Capa local inválida: ${p.slug}`);
    assert.ok(['spotify','youtube','official','uploaded'].includes(p.coverSource));
    if(p.coverSource==='uploaded')assert.ok(evidence.coverUpload?.sha256 && /cliente/i.test(p.coverCredit), 'Capa fornecida precisa de procedência própria, sem fonte de download inventada');
    else assert.ok(new URL(p.coverSourceUrl).protocol === 'https:', 'Fonte de capa HTTPS');
    const cover = path.join(root, 'public', p.coverUrl);
    assert.ok((await stat(cover)).size > 1000, `Capa vazia: ${p.slug}`);
    const decoded = await sharp(await readFile(cover)).metadata();
    assert.ok(decoded.width >= 300 && decoded.height >= 200, `Capa pequena: ${p.slug}`);
    for (const s of p.segments) {
      const own=s.timeline==='showcase';
      const duration=own?evidence.mediaSources?.find(item=>item.segmentId===s.id)?.durationSeconds:evidence.durationSeconds;
      assert.ok(Number.isFinite(duration)&&Number.isFinite(s.start) && Number.isFinite(s.end) && s.start >= 0 && s.end > s.start && s.end <= duration+0.001, `Intervalo inválido: ${p.slug}`);
      if(own)assert.ok(s.start===0&&s.rangeStatus==='explicit'&&evidence.mediaSources.find(item=>item.segmentId===s.id)?.originalRangeConfirmed===false,'Upload próprio não confirma limites do lançamento original');
      assert.ok(['explicit','inferred','pending','chapter-boundary'].includes(s.rangeStatus) && s.sourceUrl && s.evidence, `Intervalo sem evidência: ${p.slug}`);
      assert.ok(!s.clipUrl && !s.mobileClipUrl && !s.previewUrl && !s.posterUrl, 'URLs locais e recortes não publicados ficam fora do catálogo inicial');
    }
  }
  return {projects:projects.length,covers:projects.length,artists:artists.length,explicitOriginalRanges:projects.flatMap(p=>p.segments).filter(s=>s.rangeStatus==='explicit'&&s.timeline!=='showcase').length,ownUploadRanges:projects.flatMap(p=>p.segments).filter(s=>s.timeline==='showcase').length,inferredOriginalRanges:projects.flatMap(p=>p.segments).filter(s=>s.rangeStatus==='inferred').length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await validateCatalog(JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url),'utf8'))),null,2));
}
