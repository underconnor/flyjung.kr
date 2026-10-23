import { copyFile, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderConcept } from '../experiments/bold/render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'concept-dist');
const staging = path.join(root, '.concept-dist-next');
const previous = path.join(root, '.runtime/build/concept-dist-previous');
const assets = [
  'assets/favicon.svg',
  'assets/fonts/noto-OFL.txt',
  ...Array.from({length:124}, (_, index) => `assets/fonts/noto-sans-kr-${String(index).padStart(3, '0')}.woff2`),
  'assets/projects/shinsungin-meals.png',
  'assets/projects/shinsungin-reviews.png',
  'assets/projects/momu-mission.png',
  'assets/projects/momu-feed.png',
];

async function assertRegularSource(relative) {
  const parts = relative.split('/');
  let current = path.join(root, 'src');
  for (const part of parts) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`Concept assets cannot be symlinks: ${relative}`);
  }
  if (!(await lstat(current)).isFile()) throw new Error(`Concept asset must be a file: ${relative}`);
  return current;
}

async function buildConcept() {
  await rm(staging, {recursive:true, force:true});
  await mkdir(staging, {recursive:true});
  try {
    for (const asset of assets) {
      const source = await assertRegularSource(asset);
      const destination = path.join(staging, asset);
      await mkdir(path.dirname(destination), {recursive:true});
      await copyFile(source, destination);
    }
    const fonts = (await readFile(path.join(root, 'src/styles/fonts.css'), 'utf8')).replaceAll('../assets/', '/assets/');
    const styles = await readFile(path.join(root, 'experiments/bold/concept.css'), 'utf8');
    await writeFile(path.join(staging, 'concept.css'), `${fonts}\n${styles}`);
    await copyFile(path.join(root, 'experiments/bold/concept.js'), path.join(staging, 'concept.js'));
    await writeFile(path.join(staging, 'index.html'), renderConcept());
    await writeFile(path.join(staging, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    await writeFile(path.join(staging, '404.html'), '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>별도 시안</title><h1>이 시안에는 없는 페이지입니다.</h1><a href="/">시안 처음으로</a></html>');
    const current = await lstat(output).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (current && (!current.isDirectory() || current.isSymbolicLink())) throw new Error('Concept output must be a real directory');
    await mkdir(path.dirname(previous), {recursive:true});
    await rm(previous, {recursive:true,force:true});
    if (current) await rename(output, previous);
    try { await rename(staging, output); }
    catch (error) { if (current) await rename(previous, output); throw error; }
    await rm(previous, {recursive:true, force:true});
    console.log(JSON.stringify({output,assets:assets.length,pages:2,publicDeployment:false},null,2));
  } catch(error) {
    await rm(staging, {recursive:true,force:true});
    throw error;
  }
}
await buildConcept();
