// Offline maintenance for the loopback preview; never exposes an administrative route.
import { readFile, writeFile, open, unlink, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const env = await readFile('.env.local','utf8');
assert.match(env,/^PORTFOLIO_MODE=local\s*$/m,'This script only supports local preview data.');
const directory = path.resolve(/^PORTFOLIO_DATA_DIR=(.+)$/m.exec(env)?.[1].trim() || '.local-data');
const relative = path.relative(process.cwd(),directory);
assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
const catalog = JSON.parse(await readFile(new URL('../data/catalog.json',import.meta.url),'utf8')).portfolio;
const fields = ['title','character','work','date','summary','participation','credits','creditSource','coverUrl','coverSource','coverSourceUrl','coverAlt','coverCredit','spotifyUrl','checkedAt','videoAvailability','verification','editShowcaseUrl','editShowcaseDuration'];
async function merge(data) {
  for (const source of catalog.projects) {
    const existing = data.projects.find(p=>p.id===source.id || p.youtubeUrl===source.youtubeUrl);
    if (!existing) { data.projects.push(structuredClone(source)); continue; }
    for (const field of fields) if (field in source) existing[field] = source[field];
    if (!existing.tools.length && source.tools.length) { existing.tools=source.tools; existing.toolsSource=source.toolsSource; }
    const oldSegments = existing.segments;
    existing.segments = source.segments.map(segment=>{
      const saved = oldSegments.find(s=>s.id===segment.id || (s.start===segment.start && s.end===segment.end));
      return {...segment,...(saved?.clipUrl ? {clipUrl:saved.clipUrl} : {}),...(saved?.previewUrl ? {previewUrl:saved.previewUrl,previewStart:saved.previewStart} : {})};
    });
    // Preserve manually supplied media even if an audit cannot locate its source range.
    existing.segments.push(...oldSegments.filter(s=>(s.clipUrl || s.previewUrl) && !existing.segments.some(n=>n.id===s.id || (n.start===s.start && n.end===s.end))));
  }
  for (const artist of catalog.artists) if (!data.artists.some(a=>a.id===artist.id)) data.artists.push(artist);
  return data;
}
const dataPath = path.join(directory,'portfolio.json');
if (!process.argv.includes('--apply')) {
  const data = await merge(JSON.parse(await readFile(dataPath,'utf8')));
  console.log(`Dry run: ${data.projects.length} local projects. Use --apply to sync researched metadata; saved settings, inquiries, status, process and media are preserved.`);
} else {
  const lockPath=path.join(directory,'.write-lock'); const lock=await open(lockPath,'wx',0o600);
  try {
    const original=await readFile(dataPath,'utf8');
    const data=await merge(JSON.parse(original));
    const backup=path.join(directory,`catalog-backup-${randomUUID()}.json`);
    await writeFile(backup,original,{flag:'wx',mode:0o600});
    const temporary=path.join(directory,`catalog-sync-${randomUUID()}.tmp`);
    await writeFile(temporary,JSON.stringify(data,null,2),{flag:'wx',mode:0o600});
    await rename(temporary,dataPath);
    console.log(`Synced ${data.projects.length} local projects. Private backup retained in the local data directory.`);
  } finally { await lock.close(); await unlink(lockPath); }
}
