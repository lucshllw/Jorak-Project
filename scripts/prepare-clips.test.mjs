import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, stat, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateIdentifiers, validateRange, resolveLocalInput, resolveOutputRoot, loadManifest, previewDimensions, runTool, prepareClips, probeVideo } from './prepare-clips.mjs';

const workspace = process.cwd();
const privateRoot = path.join(workspace, '.local-data');
await mkdir(privateRoot, { recursive: true });
const fixtures = await mkdtemp(path.join(privateRoot, 'clip-pipeline-test-'));
const output = path.join(privateRoot, 'clips', path.basename(fixtures));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe';
const valid = { projectSlug: 'fixture-player', segmentId: 'test-only', input: 'source.mp4', start: 1.1, end: 3.4,
  authorized: true, rangeConfirmed: true, evidence: 'Fixture sintético de teste; não é uma edição do JORAK.', sourceUrl: 'https://ffmpeg.org/' };
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');

// Finish asynchronous discovery before registering any test or cleanup hook.
// A top-level await between registrations can let node:test finish the first
// group and run the global cleanup before the remaining tests are registered.
let toolsAvailable = true;
try { await runTool(ffmpeg, ['-version']); await runTool(ffprobe, ['-version']); } catch { toolsAvailable = false; }

after(async () => {
  if (process.env.KEEP_CLIP_FIXTURE === '1') {
    console.log(`Fixture sintético preservado: ${output}`);
    console.log(`Original sintético: ${path.join(fixtures, 'source.mp4')}`);
    return;
  }
  for (const target of [fixtures, output]) {
    const relative = path.relative(privateRoot, target);
    assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'cleanup limitado aos diretórios do teste');
    await rm(target, { recursive: true, force: true });
  }
});

test('exige autorização e confirmação independente dos horários', () => {
  assert.doesNotThrow(() => validateRange(valid));
  for (const value of [false, undefined, 'true', 1]) {
    assert.throws(() => validateRange({ ...valid, authorized: value }), /autorização/);
    assert.throws(() => validateRange({ ...valid, rangeConfirmed: value }), /confirmação humana/);
  }
});

test('rejeita limites não numéricos, intervalos invertidos e intervalos fora do original', () => {
  for (const entry of [{ start: -1 }, { end: 1 }, { start: NaN }, { end: Infinity }, { start: '1.1' }, { end: 1.11 }, { start: [1, 2] }]) {
    assert.throws(() => validateRange({ ...valid, ...entry }), /Intervalo inválido/);
  }
  assert.throws(() => validateRange(valid, 3.38), /ultrapassa/);
  assert.doesNotThrow(() => validateRange(valid, 3.4));
});

test('ids não permitem travessia, separadores ou argumentos', () => {
  assert.doesNotThrow(() => validateIdentifiers(valid));
  for (const id of ['../out', '..', 'a/b', 'a\\b', '-y', 'nome com espaço', 'A', 'a'.repeat(97)]) {
    assert.throws(() => validateIdentifiers({ ...valid, segmentId: id }), /segmentId/);
  }
});

test('entrada aceita somente arquivos locais, nunca protocolos ou playlists', async () => {
  for (const input of ['https://example.com/video.mp4', 'http://localhost/video.mp4', 'file:///tmp/video.mp4', 'pipe:0', '//host/video.mp4', '\\\\host\\video.mp4', 'source.m3u8', 'source.mp4\n-y']) {
    await assert.rejects(resolveLocalInput(input, fixtures), /local|playlists|controle/);
  }
  await assert.rejects(resolveLocalInput('missing.mp4', fixtures), /não encontrado/);
  const input = path.join(fixtures, 'empty.mp4');
  await writeFile(input, 'empty');
  assert.equal(await resolveLocalInput('empty.mp4', fixtures), input);
});

test('saída permanece em .local-data/clips e rejeita links simbólicos', async (context) => {
  assert.equal(await resolveOutputRoot(workspace, path.relative(workspace, output)), output);
  for (const target of ['public/clips', '.local-data', '.local-data/clips/../../public', '../clips']) {
    await assert.rejects(resolveOutputRoot(workspace, target), /dentro de/);
  }
  const link = path.join(privateRoot, 'clips', `${path.basename(fixtures)}-link`);
  await mkdir(path.dirname(link), { recursive: true });
  try { await symlink(fixtures, link, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { context.diagnostic('Sistema não permite criar o link de teste.'); return; } throw error; }
  try { await assert.rejects(resolveOutputRoot(workspace, path.relative(workspace, path.join(link, 'child'))), /simbólicos|resolvida/); }
  finally { await rm(link, { force: true }); }
});

test('prévia preserva proporção, usa pixels pares e limita as duas dimensões', () => {
  for (const input of [
    { width: 1920, height: 1080, sar: 1, fps: 60, rotation: 0 },
    { width: 480, height: 640, sar: 1, fps: 30, rotation: 0 },
    { width: 320, height: 180, sar: 1, fps: 15, rotation: 0 },
    { width: 720, height: 576, sar: 16 / 15, fps: 25, rotation: 0 },
    { width: 1920, height: 1080, sar: 1, fps: 30, rotation: 90 },
  ]) {
    const result = previewDimensions(input);
    const rotated = input.rotation === 90;
    const sourceWidth = rotated ? input.height : input.width, sourceHeight = rotated ? input.width : input.height;
    const expectedAspect = rotated ? sourceWidth / input.sar / sourceHeight : sourceWidth * input.sar / sourceHeight;
    assert(result.width <= 480 && result.height <= 480);
    assert(result.width <= sourceWidth && result.height <= sourceHeight);
    assert.equal(result.width % 2, 0); assert.equal(result.height % 2, 0);
    assert(Math.abs(result.width / result.height - expectedAspect) < 0.02);
    assert(result.fps <= 24 && result.fps <= input.fps);
  }
});

test('manifesto rejeita itens repetidos, intervalos agregados e falta de evidência', async () => {
  const manifestPath = path.join(fixtures, 'invalid.json');
  const raw = { ...valid, input: 'empty.mp4' };
  for (const [document, pattern] of [
    [{ version: 1, clips: [raw, raw] }, /duplicado/],
    [{ version: 1, clips: [{ ...raw, ranges: [[1, 2], [3, 4]] }] }, /estrutura desconhecida/],
    [{ version: 1, clips: [{ ...raw, evidence: '' }] }, /evidence/],
    [{ version: 1, clips: [{ ...raw, sourceUrl: 'https://user:secret@example.com/' }] }, /credenciais/],
    [{ version: 1, clips: [], download: true }, /manifesto/],
  ]) {
    await writeFile(manifestPath, JSON.stringify(document));
    await assert.rejects(loadManifest(manifestPath), pattern);
  }
});

test('exportação real: corte correto, áudio preservado, prévia sem áudio, nenhum overwrite', { skip: !toolsAvailable && 'Informe FFMPEG_PATH e FFPROBE_PATH para testar a exportação real.' }, async () => {
  const sourcePath = path.join(fixtures, 'source.mp4');
  await runTool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=48000', '-t', '5', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac', '-movflags', '+faststart', sourcePath]);
  const originalHash = hash(await readFile(sourcePath));
  const manifestPath = path.join(fixtures, 'valid.json');
  await writeFile(manifestPath, JSON.stringify({ version: 1, clips: [valid] }));
  const options = { manifestPath, workspace, output: path.relative(workspace, output), ffmpeg, ffprobe };
  const dry = await prepareClips(options);
  assert.equal(dry.mode, 'dry-run'); assert.equal(dry.clips[0].original.duration, 5);
  await assert.rejects(stat(output), { code: 'ENOENT' });
  assert.equal(hash(await readFile(sourcePath)), originalHash);

  // Preflight must reject a later invalid range before creating even the valid first export.
  await writeFile(manifestPath, JSON.stringify({ version: 1, clips: [valid, { ...valid, segmentId: 'invalid', end: 5.1 }] }));
  await assert.rejects(prepareClips({ ...options, execute: true }), /ultrapassa/);
  await assert.rejects(stat(output), { code: 'ENOENT' });
  await writeFile(manifestPath, JSON.stringify({ version: 1, clips: [valid] }));

  const exported = await prepareClips({ ...options, execute: true });
  const clip = exported.clips[0];
  assert.equal(exported.mode, 'export'); assert.equal(clip.publication, 'not-uploaded');
  assert.equal(clip.original.sha256, originalHash); assert.equal(hash(await readFile(sourcePath)), originalHash);
  const video = await probeVideo(clip.presentation.path, ffprobe), preview = await probeVideo(clip.preview.path, ffprobe);
  assert(Math.abs(video.duration - (valid.end - valid.start)) < 0.1);
  assert.equal(video.videoCodec, 'h264'); assert.equal(video.audioCodec, 'aac');
  assert.equal(video.width, 640); assert.equal(video.height, 360);
  assert.equal(preview.audioStream, null); assert.equal(preview.audioCodec, null);
  assert.equal(preview.width, 480); assert.equal(preview.height, 270);
  assert(preview.duration <= 8 && preview.duration <= video.duration + 0.05);
  assert.equal(clip.presentation.sha256, hash(await readFile(clip.presentation.path)));
  assert.equal(clip.preview.sha256, hash(await readFile(clip.preview.path)));
  const comparison = await runTool(ffmpeg, ['-hide_banner', '-loglevel', 'info', '-nostdin', '-i', sourcePath, '-i', clip.presentation.path,
    '-filter_complex', `[0:v]trim=start=${valid.start}:end=${valid.end},setpts=PTS-STARTPTS[original];[original][1:v]ssim`, '-an', '-f', 'null', '-']);
  const similarity = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1]);
  assert(similarity > 0.98, `Os quadros precisam corresponder ao intervalo original (${similarity}).`);
  const report = JSON.parse(await readFile(path.join(path.dirname(clip.preview.path), 'export.json'), 'utf8'));
  assert.equal(report.preview.sha256, clip.preview.sha256);
  await assert.rejects(prepareClips({ ...options, execute: true }), /já existe/);
  assert.equal(clip.presentation.sha256, hash(await readFile(clip.presentation.path)));
});

test('recorte longo mantém áudio e enquadramento; a prévia termina em oito segundos', { skip: !toolsAvailable && 'Informe FFMPEG_PATH e FFPROBE_PATH para testar a exportação real.' }, async () => {
  const sourcePath = path.join(fixtures, 'long-source.mp4');
  await runTool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-f', 'lavfi', '-i', 'testsrc2=size=960x540:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '25', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac', '-movflags', '+faststart', sourcePath]);
  const entry = { ...valid, segmentId: 'long-test-only', input: 'long-source.mp4', start: 2, end: 22 };
  const manifestPath = path.join(fixtures, 'long.json');
  await writeFile(manifestPath, JSON.stringify({ version: 1, clips: [entry] }));
  const result = await prepareClips({ manifestPath, workspace, output: path.relative(workspace, output), ffmpeg, ffprobe, execute: true });
  const clip = result.clips[0];
  assert(Math.abs(clip.presentation.duration - 20) < 0.1);
  assert.equal(clip.presentation.width, 960); assert.equal(clip.presentation.height, 540);
  assert.equal(clip.presentation.audioCodec, 'aac');
  assert.equal(clip.preview.duration, 8);
  assert.equal(clip.preview.width, 480); assert.equal(clip.preview.height, 270);
  assert.equal(clip.preview.audioStream, null); assert.equal(clip.preview.fps, 24);
  console.log(`Player sintético, 20 segundos: ${clip.presentation.path}`);
  console.log(`Prévia sintética, 8 segundos: ${clip.preview.path}`);
});
