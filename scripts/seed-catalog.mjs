// Reproducible, offline catalog generation. Never writes saved owner data or a database.
import { readFile, writeFile } from 'node:fs/promises';
import { validateCatalog } from './validate-catalog.mjs';
const catalog = JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8'));
await validateCatalog(catalog);
const data = structuredClone(catalog.portfolio);
data.projects.forEach(project => { project.status = 'draft'; });
await writeFile(new URL('../src/lib/seed.ts', import.meta.url), `// Generated offline from data/catalog.json by scripts/seed-catalog.mjs.\n// Publishing and media still require owner review. No remote database is modified.\nimport type { PortfolioData } from './types';\n\nexport const seedPortfolio: PortfolioData = ${JSON.stringify(data, null, 2)};\n`, 'utf8');
console.log(`${data.projects.length} projetos, ${data.artists.length} artistas e ${data.projects.filter(p => p.featured).length} destaques; todos em rascunho.`);
