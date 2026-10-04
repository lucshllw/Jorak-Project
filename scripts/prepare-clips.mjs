#!/usr/bin/env node
/** Offline maintenance only: local, explicitly authorized sources; no network or database writes. */
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, realpath, lstat, stat, rename, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,95}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi']);
const ENTRY_KEYS = new Set(['projectSlug', 'segmentId', 'input', 'start', 'end', 'authorized', 'rangeConfirmed', 'evidence', 'sourceUrl']);

function fail(message) { throw new Error(message); }
function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
function string(value, field) {
  if (typeof value !== 'string' || !value.trim() || CONTROL.test(value)) fail(`${field}: informe um texto válido, sem caracteres de controle.`);
  return value.trim();
}

export function validateIdentifiers(entry) {
  for (const key of ['projectSlug', 'segmentId']) {
    if (typeof entry[key] !== 'string' || !SAFE_ID.test(entry[key])) fail(`${key}: use letras minúsculas, números e hífens (até 96 caracteres).`);
  }
}

export function validateRange(entry, duration) {
  if (entry.authorized !== true) fail('O arquivo precisa de autorização explícita: authorized: true.');
  if (entry.rangeConfirmed !== true) fail('Os limites precisam de confirmação humana: rangeConfirmed: true. Horários inferidos não bastam.');
  if (typeof entry.start !== 'number' || typeof entry.end !== 'number' || !Number.isFinite(entry.start) || !Number.isFinite(entry.end)
      || entry.start < 0 || entry.end <= entry.start || entry.end - entry.start < 0.1) {
    fail('Intervalo inválido: start/end devem ser segundos finitos, com início >= 0 e duração >= 0,1 s.');
  }
  if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0 || entry.end > duration + 0.001)) {
    fail(`O intervalo ${entry.start}–${entry.end} ultrapassa a duração do arquivo (${duration} s).`);
  }
}

export async function resolveLocalInput(value, manifestDirectory) {
  const input = string(value, 'input');
  const windowsDrive = /^[a-z]:[\\/]/i.test(input);
  if ((!windowsDrive && /^[a-z][a-z0-9+.-]*:/i.test(input)) || input.startsWith('//') || input.startsWith('\\\\')) {
    fail('input precisa ser um arquivo local. URLs, protocolos e compartilhamentos de rede não são aceitos.');
  }
  const candidate = path.resolve(manifestDirectory, input);
  if (!VIDEO_EXTENSIONS.has(path.extname(candidate).toLowerCase())) fail('Use um vídeo local MP4, MOV, M4V, MKV, WebM ou AVI; playlists não são aceitas.');
  const resolved = await realpath(candidate).catch(() => fail(`Arquivo local não encontrado: ${candidate}`));
  if (resolved.startsWith('\\\\') || resolved.startsWith('//')) fail('O caminho resolvido deve continuar local; compartilhamentos não são aceitos.');
  if (!(await stat(resolved)).isFile()) fail(`input não é um arquivo: ${resolved}`);
  return resolved;
}

export async function resolveOutputRoot(workspace, value) {
  const workspaceReal = await realpath(workspace);
  const allowedRoot = path.join(workspaceReal, '.local-data', 'clips');
  const outputRoot = path.resolve(workspaceReal, value || path.join('.local-data', 'clips'));
  if (!inside(allowedRoot, outputRoot)) fail('A saída precisa ficar dentro de .local-data/clips deste projeto.');
  const relative = path.relative(workspaceReal, outputRoot);
  let current = workspaceReal;
  for (const component of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    let info;
    try { info = await lstat(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (info.isSymbolicLink() || !info.isDirectory()) fail(`A saída não pode passar por links simbólicos ou arquivos: ${current}`);
    const canonical = await realpath(current);
    if (!inside(workspaceReal, canonical)) fail(`A saída resolvida saiu da pasta do projeto: ${current}`);
  }
  return outputRoot;
}

export async function loadManifest(manifestPath) {
  const text = await readFile(manifestPath, 'utf8');
  let manifest;
  try { manifest = JSON.parse(text); } catch { fail('O manifesto precisa ser JSON válido.'); }
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.clips) || !manifest.clips.length || manifest.clips.length > 1000) {
    fail('Use um manifesto { version: 1, clips: [...] }, com 1 a 1.000 intervalos.');
  }
  if (Object.keys(manifest).some((key) => !['version', 'clips'].includes(key))) fail('O manifesto só aceita version e clips.');
  const seen = new Set();
  const entries = [];
  for (const [index, raw] of manifest.clips.entries()) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !ENTRY_KEYS.has(key))) {
      fail(`Intervalo ${index + 1}: estrutura desconhecida. Use um item separado para cada participação contínua.`);
    }
    validateIdentifiers(raw);
    validateRange(raw);
    const evidence = string(raw.evidence, 'evidence');
    let sourceUrl = null;
    if (raw.sourceUrl !== undefined) {
      try {
        const url = new URL(string(raw.sourceUrl, 'sourceUrl'));
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid');
        sourceUrl = url.href;
      } catch { fail('sourceUrl, quando informado, deve ser HTTPS e não conter credenciais.'); }
    }
    const key = `${raw.projectSlug}/${raw.segmentId}`;
    if (seen.has(key)) fail(`Intervalo duplicado no manifesto: ${key}`);
    seen.add(key);
    entries.push({ ...raw, evidence, sourceUrl, input: await resolveLocalInput(raw.input, path.dirname(manifestPath)) });
  }
  return entries;
}

export function runTool(binary, args, { timeout = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', done = false, overflow = false;
    const timer = setTimeout(() => { child.kill(); finish(new Error(`${path.basename(binary)} excedeu o tempo permitido.`)); }, timeout);
    function finish(error, value) {
      if (done) return;
      done = true; clearTimeout(timer);
      if (error) reject(error); else resolve(value);
    }
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > 2_000_000) { overflow = true; child.kill(); finish(new Error('Saída inesperadamente grande da ferramenta.')); }
    });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-64_000); });
    child.on('error', (error) => finish(new Error(`Não foi possível executar ${binary}: ${error.message}. Informe --ffmpeg e --ffprobe ou as variáveis correspondentes.`)));
    child.on('close', (code) => {
      if (overflow) return;
      if (code !== 0) finish(new Error(`${path.basename(binary)} falhou (${code}): ${stderr.trim() || 'sem diagnóstico'}`));
      else finish(null, { stdout, stderr });
    });
  });
}

export async function probeVideo(file, ffprobe) {
  const { stdout } = await runTool(ffprobe, ['-v', 'error', '-protocol_whitelist', 'file', '-show_entries',
    'format=duration:stream=index,codec_type,codec_name,width,height,sample_aspect_ratio,avg_frame_rate,duration:stream_disposition=attached_pic:stream_side_data=rotation', '-of', 'json', file]);
  let data;
  try { data = JSON.parse(stdout); } catch { fail('FFprobe retornou metadados inválidos.'); }
  const video = data.streams?.find((stream) => stream.codec_type === 'video' && stream.disposition?.attached_pic !== 1);
  const audio = data.streams?.find((stream) => stream.codec_type === 'audio');
  const duration = Number(data.format?.duration || video?.duration);
  if (!video || !Number.isFinite(duration) || duration <= 0 || !(video.width >= 2) || !(video.height >= 2)) fail(`O arquivo não contém um vídeo válido: ${file}`);
  const [sarN, sarD] = String(video.sample_aspect_ratio || '1:1').split(':').map(Number);
  const sar = sarN > 0 && sarD > 0 ? sarN / sarD : 1;
  const [fpsN, fpsD] = String(video.avg_frame_rate || '0/0').split('/').map(Number);
  return { duration, width: video.width, height: video.height, sar, fps: fpsN > 0 && fpsD > 0 ? fpsN / fpsD : 24,
    videoStream: video.index, videoCodec: video.codec_name, audioStream: audio?.index ?? null, audioCodec: audio?.codec_name ?? null,
    rotation: Number(video.side_data_list?.find((side) => side.rotation !== undefined)?.rotation || 0) };
}

export function previewDimensions(info) {
  const rotated = Math.abs(info.rotation % 180) === 90;
  const width = rotated ? info.height : info.width;
  const height = rotated ? info.width : info.height;
  const sar = rotated ? 1 / info.sar : info.sar;
  const displayWidth = width * sar;
  // Square pixels while bounding both dimensions and never enlarging source pixels.
  const factor = Math.min(1, 480 / displayWidth, 480 / height, width / displayWidth);
  const outWidth = Math.floor(displayWidth * factor / 2) * 2;
  const outHeight = Math.floor(height * factor / 2) * 2;
  if (outWidth < 2 || outHeight < 2) fail('A proporção do vídeo é inválida para a prévia.');
  return { width: outWidth, height: outHeight, fps: Math.min(24, info.fps) };
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function exists(file) {
  try { await lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export async function prepareClips({ manifestPath, workspace = process.cwd(), output, ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg', ffprobe = process.env.FFPROBE_PATH || 'ffprobe', execute = false }) {
  const resolvedManifest = path.resolve(manifestPath);
  const entries = await loadManifest(resolvedManifest);
  const outputRoot = await resolveOutputRoot(workspace, output);
  const probes = new Map();
  const plans = [];
  // Check every item before exporting anything, so an invalid later range creates no partial batch.
  for (const entry of entries) {
    const destination = path.join(outputRoot, entry.projectSlug, entry.segmentId);
    if (!inside(outputRoot, destination)) fail('O destino do recorte saiu da pasta autorizada.');
    if (inside(outputRoot, entry.input)) fail('O original não pode estar dentro da pasta de exportação.');
    if (await exists(destination)) fail(`O destino já existe; nada será sobrescrito: ${destination}`);
    if (!probes.has(entry.input)) probes.set(entry.input, await probeVideo(entry.input, ffprobe));
    const source = probes.get(entry.input);
    validateRange(entry, source.duration);
    plans.push({ ...entry, source, duration: entry.end - entry.start, destination, preview: previewDimensions(source) });
  }
  const report = { version: 1, mode: execute ? 'export' : 'dry-run', createdAt: new Date().toISOString(), outputRoot, clips: [] };
  if (!execute) {
    report.clips = plans.map(({ projectSlug, segmentId, input, source, start, end, duration, destination, preview, evidence, sourceUrl }) => ({
      projectSlug, segmentId, original: { path: input, ...source }, start, end, duration, destination,
      presentation: { path: path.join(destination, 'presentation.mp4'), codec: 'h264', audio: source.audioStream === null ? null : 'aac' },
      preview: { path: path.join(destination, 'preview.mp4'), duration: Math.min(8, duration), ...preview, audio: null }, evidence, sourceUrl,
    }));
    return report;
  }
  const inputHashes = new Map();
  for (const plan of plans) {
    await resolveOutputRoot(workspace, path.relative(workspace, plan.destination));
    await mkdir(path.dirname(plan.destination), { recursive: true });
    await mkdir(plan.destination); // Exclusive folder; existing output is never reused.
    const presentationPartial = path.join(plan.destination, 'presentation.partial.mp4');
    const previewPartial = path.join(plan.destination, 'preview.partial.mp4');
    try {
      if (!inputHashes.has(plan.input)) inputHashes.set(plan.input, await sha256(plan.input));
      const inputHash = inputHashes.get(plan.input);
      const audioArgs = plan.source.audioStream === null ? ['-an'] : ['-map', `0:${plan.source.audioStream}`, '-c:a', 'aac', '-b:a', '192k'];
      await runTool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-protocol_whitelist', 'file', '-i', plan.input,
        '-ss', String(plan.start), '-t', String(plan.duration), '-map', `0:${plan.source.videoStream}`, ...audioArgs,
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-threads', '2', '-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart', presentationPartial], { timeout: 1_200_000 });
      const presentation = await probeVideo(presentationPartial, ffprobe);
      const tolerance = Math.max(0.12, 2 / presentation.fps);
      if (Math.abs(presentation.duration - plan.duration) > tolerance) fail('A duração exportada não corresponde ao intervalo confirmado.');
      if (presentation.videoCodec !== 'h264' || (plan.source.audioStream !== null && presentation.audioCodec !== 'aac')) fail('Os codecs da apresentação não correspondem ao perfil esperado.');
      const target = previewDimensions(presentation);
      const previewDuration = Math.min(8, presentation.duration, plan.duration);
      await runTool(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-protocol_whitelist', 'file', '-i', presentationPartial,
        '-t', String(previewDuration), '-map', `0:${presentation.videoStream}`, '-an', '-vf', `scale=${target.width}:${target.height}:flags=lanczos,setsar=1,fps=${target.fps}`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '28', '-pix_fmt', 'yuv420p', '-threads', '2', '-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart', previewPartial], { timeout: 300_000 });
      const preview = await probeVideo(previewPartial, ffprobe);
      if (preview.audioStream !== null || preview.width > 480 || preview.height > 480 || preview.duration > 8 + tolerance
          || preview.duration > plan.duration + tolerance || preview.width > presentation.width || preview.height > presentation.height) {
        fail('A prévia não respeitou os limites de resolução, duração ou áudio.');
      }
      if (await sha256(plan.input) !== inputHash) fail('O original mudou durante a exportação; revise o arquivo antes de usar os recortes.');
      const presentationPath = path.join(plan.destination, 'presentation.mp4'), previewPath = path.join(plan.destination, 'preview.mp4');
      await rename(presentationPartial, presentationPath); await rename(previewPartial, previewPath);
      const result = { projectSlug: plan.projectSlug, segmentId: plan.segmentId, authorized: true, rangeConfirmed: true,
        start: plan.start, end: plan.end, evidence: plan.evidence, sourceUrl: plan.sourceUrl,
        original: { path: plan.input, sha256: inputHash, ...plan.source },
        presentation: { path: presentationPath, sha256: await sha256(presentationPath), bytes: (await stat(presentationPath)).size, ...presentation },
        preview: { path: previewPath, sha256: await sha256(previewPath), bytes: (await stat(previewPath)).size, ...preview },
        publication: 'not-uploaded', createdAt: new Date().toISOString() };
      await writeFile(path.join(plan.destination, 'export.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
      report.clips.push(result);
    } catch (error) {
      await writeFile(path.join(plan.destination, 'failed.json'), `${JSON.stringify({ status: 'failed', message: error.message, createdAt: new Date().toISOString() }, null, 2)}\n`, { flag: 'wx' }).catch(() => {});
      throw error;
    }
  }
  return report;
}

function parseArgs(args) {
  const result = { execute: false };
  const flags = { '--manifest': 'manifestPath', '--output': 'output', '--ffmpeg': 'ffmpeg', '--ffprobe': 'ffprobe' };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--execute') { result.execute = true; continue; }
    if (argument === '--help' || argument === '-h') { result.help = true; continue; }
    if (!flags[argument] || !args[index + 1] || args[index + 1].startsWith('--')) fail(`Argumento desconhecido ou sem valor: ${argument}`);
    if (result[flags[argument]] !== undefined) fail(`Argumento repetido: ${argument}`);
    result[flags[argument]] = args[++index];
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Uso: node scripts/prepare-clips.mjs --manifest .local-data/clip-inputs.json [--execute] [--output .local-data/clips/lote] [--ffmpeg caminho] [--ffprobe caminho]\nSem --execute: valida os arquivos e imprime o plano sem criar saídas. Não baixa, envia ou publica mídia.');
    } else {
      if (!options.manifestPath) fail('Informe --manifest. Use --help para consultar o formato.');
      console.log(JSON.stringify(await prepareClips(options), null, 2));
    }
  } catch (error) { console.error(`Recortes: ${error.message}`); process.exitCode = 1; }
}
