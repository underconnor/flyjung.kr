import { copyFile, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderConcept as renderArchive } from '../experiments/bold/render.mjs';
import { renderConcept as renderStudio } from '../experiments/studio/render.mjs';
import { renderConcept as renderFlight } from '../experiments/flight/render.mjs';
import { renderConcept as renderNight } from '../experiments/night/render.mjs';
import { renderConcept as renderTerminal } from '../experiments/terminal/render.mjs';
import { renderConcept as renderHangar } from '../experiments/hangar/render.mjs';
import { projects } from '../site/data/projects.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'concept-dist');
const staging = path.join(root, '.concept-dist-next');
const previous = path.join(root, '.runtime/build/concept-dist-previous');
const concepts = [
  { source: 'night', filename: 'night', pathname: 'index.html', render: renderNight },
  { source: 'terminal', filename: 'terminal', pathname: 'terminal/index.html', render: renderTerminal },
  { source: 'hangar', filename: 'hangar', pathname: 'hangar/index.html', render: renderHangar },
  { source: 'studio', filename: 'studio', pathname: 'indigo/index.html', render: renderStudio },
  { source: 'flight', filename: 'flight', pathname: 'flight/index.html', render: renderFlight },
  { source: 'bold', filename: 'concept', pathname: 'archive/index.html', render: renderArchive },
];
function collectProjectAssets(projects) {
  const assets = new Set();
  const imageTypes = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif']);
  for (const project of projects) {
    if (!Array.isArray(project.images)) throw new Error(`Project images must be an array: ${project.id}`);
    for (const image of project.images) {
      const src = image?.src;
      if (typeof src !== 'string' || !src.startsWith('/assets/')) {
        throw new Error(`Project image must use a local /assets/ path: ${project.id}`);
      }
      let decoded;
      try { decoded = decodeURIComponent(src); }
      catch { throw new Error(`Invalid project image path: ${src}`); }
      if (decoded.endsWith('/') || /[\\?#\u0000-\u001f\u007f]/.test(decoded) || decoded.split('/').some(part => part === '..' || (part.startsWith('.') && part !== '.'))) {
        throw new Error(`Unsafe project image path: ${src}`);
      }
      const relative = path.posix.normalize(decoded).slice(1);
      if (!relative.startsWith('assets/') || !imageTypes.has(path.posix.extname(relative).toLowerCase())) {
        throw new Error(`Project image must stay inside assets and use a public image type: ${src}`);
      }
      assets.add(relative);
    }
  }
  return [...assets];
}

const assets = [...new Set([
  'assets/favicon.svg',
  'assets/fonts/noto-OFL.txt',
  ...Array.from({length:124}, (_, index) => `assets/fonts/noto-sans-kr-${String(index).padStart(3, '0')}.woff2`),
  ...collectProjectAssets(projects),
])];

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
    await mkdir(path.join(staging, 'aircraft'));
    await copyFile(await assertRegularSource('model.mjs', path.join(root, 'experiments/aircraft')), path.join(staging, 'aircraft/model.mjs'));
    await mkdir(path.join(staging, 'duck'));
    await copyFile(await assertRegularSource('constellation.mjs', path.join(root, 'experiments/duck')), path.join(staging, 'duck/constellation.mjs'));
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
    console.log(JSON.stringify({output,assets:assets.length + 1,sharedModules:2,pages:concepts.length + 1,routes:concepts.map(concept => '/' + concept.pathname.replace('index.html','')),publicDeployment:false},null,2));
  } catch(error) {
    await rm(staging, {recursive:true,force:true});
    throw error;
  }
}
await buildConcept();
