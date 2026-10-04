import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';

const destination = path.join(process.cwd(), '.env.local');
const portPosition = process.argv.indexOf('--port');
const port = portPosition >= 0 ? Number(process.argv[portPosition + 1]) : 3100;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Informe uma porta entre 1024 e 65535.');
const exists = await access(destination).then(() => true).catch(() => false);
if (exists) {
  console.log('A configuração local já existe. Nenhum arquivo privado foi alterado.');
  process.exit(0);
}
const environment = [
  '# Exclusivo para desenvolvimento neste computador. Use Supabase em produção.',
  'PORTFOLIO_MODE=local', 'PORTFOLIO_LOCAL_PREVIEW=true',
  `PORTFOLIO_SITE_ORIGIN=http://127.0.0.1:${port}`,
  'PORTFOLIO_DATA_DIR=.local-data', 'PORTFOLIO_TRUST_PROXY=false', '',
].join('\n');
await writeFile(destination, environment, { flag: 'wx', mode: 0o600 });
console.log('Configuração local criada. A aplicação não tem área administrativa nem credenciais de acesso.');
