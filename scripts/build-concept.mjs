import { copyFile, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderConcept as renderArchive } from '../experiments/bold/render.mjs';
import { renderConcept as renderStudio } from '../experiments/studio/render.mjs';
import { renderConcept as renderFlight } from '../experiments/flight/render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'concept-dist');
const staging = path.join(root, '.concept-dist-next');
const previous = path.join(root, '.runtime/build/concept-dist-previous');
const concepts = [
  { source: 'studio', filename: 'studio', pathname: 'index.html', render: renderStudio },
  { source: 'flight', filename: 'flight', pathname: 'flight/index.html', render: renderFlight },
  { source: 'bold', filename: 'concept', pathname: 'archive/index.html', render: renderArchive },
];
const assets = [
  'assets/favicon.svg',
  'assets/fonts/noto-OFL.txt',
  ...Array.from({length:124}, (_, index) => `assets/fonts/noto-sans-kr-${String(index).padStart(3, '0')}.woff2`),
  'assets/projects/shinsungin-meals.png',
  'assets/projects/shinsungin-reviews.png',
  'assets/projects/momu-mission.png',
  'assets/projects/momu-feed.png',
];

async function assertRegularSource(relative, sourceRoot = path.join(root, 'src')) {
  const parts = relative.split('/');
  let current = sourceRoot;
  const rootInfo = await lstat(current);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('Concept sources must be a real directory');
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
    for (const concept of concepts) {
      const sourceRoot = path.join(root, 'experiments', concept.source);
      const styles = await readFile(await assertRegularSource('concept.css', sourceRoot), 'utf8');
      await writeFile(path.join(staging, `${concept.filename}.css`), `${fonts}\n${styles}`);
      await copyFile(await assertRegularSource('concept.js', sourceRoot), path.join(staging, `${concept.filename}.js`));
      await mkdir(path.dirname(path.join(staging, concept.pathname)), {recursive:true});
      await writeFile(path.join(staging, concept.pathname), concept.render());
    }
    await mkdir(path.join(staging, 'flight-assets'));
    await copyFile(await assertRegularSource('assets/flight-duck.png', path.join(root, 'experiments/flight')), path.join(staging, 'flight-assets/flight-duck.png'));
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
    console.log(JSON.stringify({output,assets:assets.length + 1,pages:concepts.length + 1,routes:['/','/flight/','/archive/'],publicDeployment:false},null,2));
  } catch(error) {
    await rm(staging, {recursive:true,force:true});
    throw error;
  }
}
await buildConcept();
