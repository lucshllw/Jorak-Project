import 'server-only';
import { mkdir, open, readFile, rename, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { PortfolioData, Inquiry } from '@/lib/types';
import { seedPortfolio } from '@/lib/seed';
import { getMode, HttpError } from './config';

export type StoredMedia = { id: string; filename: string; mime: string; size: number; createdAt: string };
export type LocalData = PortfolioData & { inquiries: Inquiry[]; media: StoredMedia[]; version: 1 };
const shared = globalThis as typeof globalThis & { jorakStoreQueue?: Promise<void> };

export function localDirectory() {
  if (getMode() !== 'local') throw new HttpError(503, 'Armazenamento local indisponível neste modo.');
  // Caminho exclusivamente de desenvolvimento: não rastrear nem empacotar dados privados.
  const directory = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.PORTFOLIO_DATA_DIR || '.local-data');
  const relative = path.relative(process.cwd(), directory);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !relative) throw new HttpError(503, 'O diretório local precisa ficar dentro do projeto.');
  return directory;
}
function freshData(): LocalData {
  return { ...structuredClone(seedPortfolio), mode: 'local', inquiries: [], media: [], version: 1 };
}
async function readData(): Promise<LocalData> {
  try {
    const data = JSON.parse(await readFile(/* turbopackIgnore: true */ path.join(localDirectory(), 'portfolio.json'), 'utf8')) as LocalData;
    if (data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.artists) || !Array.isArray(data.inquiries) || !Array.isArray(data.media)) throw new Error('Formato de dados local inválido.');
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return freshData();
    throw error;
  }
}
async function atomicWrite(data: LocalData) {
  const directory = localDirectory();
  const temporary = path.join(directory, `portfolio.${randomUUID()}.tmp`);
  const handle = await open(/* turbopackIgnore: true */ temporary, 'wx', 0o600);
  try { await handle.writeFile(JSON.stringify(data, null, 2), 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  try { await rename(temporary, path.join(directory, 'portfolio.json')); }
  catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}
async function acquireFileLock() {
  const lockPath = path.join(localDirectory(), '.write-lock');
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const handle = await open(/* turbopackIgnore: true */ lockPath, 'wx', 0o600);
      await handle.writeFile(String(process.pid));
      return async () => { await handle.close(); await unlink(lockPath).catch(() => {}); };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const info = await stat(/* turbopackIgnore: true */ lockPath).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 120000) await unlink(lockPath).catch(() => {});
      else await new Promise(resolve => setTimeout(resolve, Math.min(20 + attempt * 3, 200)));
    }
  }
  throw new HttpError(503, 'O armazenamento está ocupado. Tente salvar novamente.');
}

export async function localTransaction<T>(mutate: (data: LocalData) => T | Promise<T>): Promise<T> {
  let releaseQueue!: () => void;
  const previous = shared.jorakStoreQueue || Promise.resolve();
  shared.jorakStoreQueue = new Promise<void>(resolve => { releaseQueue = resolve; });
  await previous;
  let releaseLock: (() => Promise<void>) | undefined;
  try {
    await mkdir(localDirectory(), { recursive: true, mode: 0o700 });
    releaseLock = await acquireFileLock();
    const data = await readData();
    const result = await mutate(data);
    await atomicWrite(data);
    return structuredClone(result);
  } finally { await releaseLock?.(); releaseQueue(); }
}
export async function readLocalData(): Promise<LocalData> {
  // A primeira leitura materializa o seed no disco; leituras seguintes veem o arquivo atomicamente.
  try { await stat(/* turbopackIgnore: true */ path.join(localDirectory(), 'portfolio.json')); return await readData(); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return localTransaction(data => data);
  }
}
