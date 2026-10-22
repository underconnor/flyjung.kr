import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.some(argument => argument !== '--public')) throw new Error('Usage: node scripts/test.mjs [--public]');
const publicBuild = args.includes('--public');
const root = fileURLToPath(new URL('../', import.meta.url));
const tests = (await readdir(new URL('./', import.meta.url)))
  .filter(name => name.endsWith('.test.mjs') && (publicBuild || name !== 'public.test.mjs'))
  .sort().map(name => `scripts/${name}`);
const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SITE_BUILD: publicBuild ? 'public-dist' : 'dist' },
});
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
