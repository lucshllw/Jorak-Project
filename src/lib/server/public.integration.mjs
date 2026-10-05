// Verifica o servidor local real sem login, senhas ou acesso administrativo.
// Cria apenas fixtures identificadas por UUID e remove só esses registros ao final.
import assert from 'node:assert/strict';
import { readFile, writeFile, rename, open, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { get as httpGet } from 'node:http';

const base = (process.argv[2] || 'http://127.0.0.1:3100').replace(/\/$/, '');
const baseUrl = new URL(base);
assert.ok(['127.0.0.1', 'localhost'].includes(baseUrl.hostname) && baseUrl.protocol === 'http:', 'Executar somente no servidor local.');
const environment = await readFile('.env.local', 'utf8');
assert.match(environment, /^PORTFOLIO_MODE=local\s*$/m, 'O teste não acessa projetos remotos.');
const directory = path.resolve(/^PORTFOLIO_DATA_DIR=(.+)$/m.exec(environment)?.[1].trim() || '.local-data');
const relativeDirectory = path.relative(process.cwd(), directory);
assert.ok(relativeDirectory && !relativeDirectory.startsWith('..') && !path.isAbsolute(relativeDirectory), 'Diretório precisa permanecer no projeto.');
const dataPath = path.join(directory, 'portfolio.json');
const fixtureId = randomUUID();
const mediaId = randomUUID();
const fixtureSlug = `verification-${fixtureId}`;
const mediaFile = `${mediaId}.mp4`;
let inquiryId;
const checks = [];

async function transaction(mutate) {
  const lockPath = path.join(directory, '.write-lock');
  let lock;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { lock = await open(lockPath, 'wx', 0o600); break; }
    catch (error) { if (error.code !== 'EEXIST') throw error; await new Promise(resolve => setTimeout(resolve, 40)); }
  }
  assert.ok(lock, 'Trava de escrita do teste.');
  try {
    const data = JSON.parse(await readFile(dataPath, 'utf8'));
    mutate(data);
    const temporary = path.join(directory, `verification.${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600, flag: 'wx' });
    await rename(temporary, dataPath);
  } finally { await lock.close(); await unlink(lockPath); }
}
async function call(endpoint, { method = 'GET', body, origin = true, headers = {} } = {}) {
  return fetch(`${base}${endpoint}`, {
    method,
    headers: { ...(origin ? { Origin: base } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function check(label, response, expected) {
  assert.equal(response.status, expected, `${label}: status esperado ${expected}`);
  checks.push(label);
  return response;
}
try {
  await check('FAQ sem Origin recusado', await call('/api/faq', { method: 'POST', body: { question: 'Quanto custa?' }, origin: false }), 403);
  await check('FAQ cross-site recusado', await call('/api/faq', { method: 'POST', body: { question: 'Quanto custa?' }, headers: { Origin: 'https://externo.example' } }), 403);
  await check('FAQ não aceita campos extras', await call('/api/faq', { method: 'POST', body: { question: 'Quanto custa?', model: 'outro' } }), 400);
  await check('FAQ limita a pergunta', await call('/api/faq', { method: 'POST', body: { question: 'x'.repeat(801) } }), 400);
  await check('FAQ limita o tamanho da requisição', await call('/api/faq', { method: 'POST', body: { question: 'x'.repeat(9000) } }), 413);
  const faq = await check('FAQ responde com dados aprovados', await call('/api/faq', { method: 'POST', body: { question: 'Quanto custa uma edição?' } }), 200);
  const faqResult = await faq.json();
  assert.ok(['registered', 'ai'].includes(faqResult.mode));
  assert.match(faqResult.answer, /não têm preço fixo/i);
  assert.equal(faqResult.href, '/contato');
  const response = await check('catálogo público funciona', await call('/api/portfolio'), 200);
  const portfolio = await response.json();
  assert.equal(portfolio.mode, 'local');
  assert.ok(Array.isArray(portfolio.projects) && portfolio.projects.length > 0);
  for (const privateField of ['inquiries', 'sessions', 'media']) assert.equal(privateField in portfolio, false, `Não expor ${privateField}.`);
  checks.push('catálogo não entrega mensagens, sessões ou metadados de mídia');
  await check('catálogo recusa escrita', await call('/api/portfolio', { method: 'POST', body: {} }), 405);
  for (const endpoint of ['/admin', '/admin/projetos', '/api/admin/session', '/api/admin/projects', '/api/admin/artists', '/api/admin/settings', '/api/admin/inquiries', '/api/admin/upload', '/api/admin/upload/sign', '/api/admin/upload/complete']) {
    await check(`${endpoint} removido GET`, await call(endpoint), 404);
    await check(`${endpoint} removido POST`, await call(endpoint, { method: 'POST', body: {} }), 404);
  }
  await check('API de contato não expõe mensagens', await call('/api/contact'), 405);
  const publicProject = portfolio.projects[0];
  const projectResponse = await check('projeto e preview antigo continuam públicos sem login', await call(`/projeto/${publicProject.slug}?preview=1`), 200);
  assert.equal(projectResponse.headers.get('location'), null);
  await check('projeto inexistente continua 404', await call('/projeto/nao-existe-verification'), 404);
  await check('identificador de mídia inválido', await call('/api/media/invalido'), 404);
  await check('mídia sem referência publicada permanece privada', await call(`/api/media/${mediaId}`), 404);
  const blockedHost = await new Promise((resolve, reject) => {
    const request = httpGet(`${base}/api/portfolio`, { headers: { Host: 'externo.example' } }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
  });
  assert.equal(blockedHost, 403); checks.push('Host externo recusado');

  const bytes = Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0, 105, 115, 111, 109, 109, 112, 52, 50]);
  await mkdir(path.join(directory, 'uploads'), { recursive: true });
  await writeFile(path.join(directory, 'uploads', mediaFile), bytes, { flag: 'wx', mode: 0o600 });
  await transaction(data => {
    const project = { ...structuredClone(data.projects[0]), id: fixtureId, slug: fixtureSlug, title: 'Verificação temporária de mídia', status: 'draft', featured: false, featuredOrder: null, order: 999999, segments: [{ id: fixtureId, name: 'Fixture', kind: 'edit', clipUrl: `/api/media/${mediaId}`, start: 0, end: 1, rangeStatus:'explicit', order: 0 }] };
    data.projects.push(project);
    data.media.push({ id: mediaId, filename: mediaFile, mime: 'video/mp4', size: bytes.length, createdAt: new Date().toISOString() });
  });
  await check('mídia de rascunho privada mesmo em prévia local', await call(`/api/media/${mediaId}`), 404);
  await transaction(data => { data.projects.find(project => project.id === fixtureId).status = 'published'; });
  const range = await check('mídia publicada aceita Range', await call(`/api/media/${mediaId}`, { headers: { Range: 'bytes=4-7' } }), 206);
  assert.equal(range.headers.get('content-range'), `bytes 4-7/${bytes.length}`);
  assert.equal(await range.text(), 'ftyp');
  await check('Range fora do arquivo recusado', await call(`/api/media/${mediaId}`, { headers: { Range: 'bytes=500-900' } }), 416);
  const head = await check('HEAD de mídia publicado', await call(`/api/media/${mediaId}`, { method: 'HEAD' }), 200);
  assert.equal(head.headers.get('content-length'), String(bytes.length));
  await transaction(data => { data.projects.find(project => project.id === fixtureId).status = 'archived'; });
  await check('mídia arquivada volta a ser privada', await call(`/api/media/${mediaId}`), 404);
  await transaction(data => {
    const project = data.projects.find(project => project.id === fixtureId);
    project.status = 'draft'; project.segments[0].clipUrl = publicProject.segments.find(s=>s.clipUrl&&s.rangeStatus==='explicit').clipUrl; project.segments[0].previewUrl = `/api/media/${mediaId}`;
  });
  await check('prévia de rascunho permanece privada', await call(`/api/media/${mediaId}`), 404);
  await transaction(data => { data.projects.find(project => project.id === fixtureId).status = 'published'; });
  const previewRange = await check('prévia publicada aceita Range sem liberar upload', await call(`/api/media/${mediaId}`, { headers: { Range: 'bytes=4-7' } }), 206);
  assert.equal(await previewRange.text(), 'ftyp');
  await transaction(data => {
    const project = data.projects.find(project => project.id === fixtureId);
    project.status = 'draft'; project.segments[0].previewUrl = null; project.segments[0].posterUrl = `/api/media/${mediaId}`;
  });
  await check('quadro real de rascunho permanece privado', await call(`/api/media/${mediaId}`), 404);
  await transaction(data => { data.projects.find(project => project.id === fixtureId).status = 'published'; });
  await check('quadro referenciado por projeto publicado é acessível', await call(`/api/media/${mediaId}`, { method: 'HEAD' }), 200);
  await transaction(data => {
    const project = data.projects.find(project => project.id === fixtureId);
    project.status = 'draft'; project.segments[0].posterUrl = null; project.segments[0].mobileClipUrl = `/api/media/${mediaId}`;
  });
  await check('versão de celular de rascunho permanece privada', await call(`/api/media/${mediaId}`), 404);
  await transaction(data => { data.projects.find(project => project.id === fixtureId).status = 'published'; });
  await check('versão de celular publicada aceita Range', await call(`/api/media/${mediaId}`, { headers: { Range: 'bytes=4-7' } }), 206);

  const inquiry = { name: 'Verificação automatizada', email: 'verification@example.com', type: 'MMV', duration: '30 segundos', deadline: '', references: '', budget: '', message: 'Mensagem temporária para verificar a persistência do contato.', website: '' };
  await check('contato sem Origin recusado', await call('/api/contact', { method: 'POST', body: inquiry, origin: false }), 403);
  await check('contato cross-site recusado', await call('/api/contact', { method: 'POST', body: inquiry, headers: { Origin: 'https://externo.example' } }), 403);
  const saved = await check('contato salva de verdade', await call('/api/contact', { method: 'POST', body: inquiry }), 201);
  inquiryId = (await saved.json()).id;
  assert.ok(JSON.parse(await readFile(dataPath, 'utf8')).inquiries.some(item => item.id === inquiryId));
  checks.push('mensagem confirmada no arquivo privado');
  await check('campos inválidos recusados', await call('/api/contact', { method: 'POST', body: { ...inquiry, email: 'invalido' } }), 400);
  await check('honeypot anti-spam preservado', await call('/api/contact', { method: 'POST', body: { ...inquiry, website: 'spam.example' } }), 400);
  await check('conteúdo acima do limite recusado', await call('/api/contact', { method: 'POST', body: { ...inquiry, message: 'x'.repeat(18000) } }), 413);
  await check('formato incorreto recusado', await call('/api/contact', { method: 'POST', body: inquiry, headers: { 'Content-Type': 'text/plain' } }), 415);
  await check('limite de contato preservado', await call('/api/contact', { method: 'POST', body: inquiry }), 429);
} finally {
  await transaction(data => {
    data.projects = data.projects.filter(project => project.id !== fixtureId);
    data.media = data.media.filter(media => media.id !== mediaId);
    if (inquiryId) data.inquiries = data.inquiries.filter(inquiry => inquiry.id !== inquiryId);
  });
  await unlink(path.join(directory, 'uploads', mediaFile)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
console.log(JSON.stringify({ passed: checks.length, checks, fixturesRemoved: true }, null, 2));
