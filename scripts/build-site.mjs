import { copyFile, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleStyles } from './bundle-styles.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src');
const origin = 'https://flyjung.kr';
const requiredPages = ['index.html', 'projects/index.html', 'blog/index.html', 'cv/index.html', '404.html'];
const imageAndFontTypes = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.woff', '.woff2']);
const retainedLocalAssets = new Set([
  'assets/portfolio-original.pdf',
  'assets/fonts/flyjung-sans-regular.woff2',
  'assets/fonts/flyjung-sans-bold.woff2',
  'assets/fonts/OFL.txt',
]);
const privateName = /(?:^|\/)(?:\.[^/]+|private|review|evidence|research-evidence|_workspace|credentials?|secrets?)(?:\/|$)|portfolio-original/i;
const privateReference = /portfolio-original|\/Users\/|127\.0\.0\.1|localhost|_workspace|research-evidence|https?:\/\/(?:www\.)?figma\.com\/api\/mcp\/asset\//i;

const securityHeaders = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests

/assets/*
  Cache-Control: public, max-age=86400
`;

function isApprovedSourceFile(relative) {
  if (relative === 'app.js' || relative === 'styles.css') return true;
  if (relative.startsWith('scripts/')) return path.extname(relative) === '.js';
  // Source styles stay modular; the output ships a single styles.css.
  if (relative.startsWith('styles/')) return false;
  if (!relative.startsWith('assets/')) return false;
  return imageAndFontTypes.has(path.extname(relative).toLowerCase())
    || /^(?:[A-Za-z0-9_-]+-)?OFL(?:[-.][A-Za-z0-9_-]+)?\.txt$/i.test(path.basename(relative));
}

async function sourceFiles(folder = source, prefix = '') {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not a public asset: ${relative}`);
    // The original document and superseded font remain in source/backup only.
    if (retainedLocalAssets.has(relative)) continue;
    if (privateName.test(relative)) {
      if (entry.name === '.DS_Store') continue;
      throw new Error(`Private or hidden file in public source tree: ${relative}`);
    }
    if (entry.isDirectory()) {
      if (['assets', 'scripts', 'styles'].includes(relative) || prefix) {
        files.push(...await sourceFiles(path.join(folder, entry.name), relative));
      }
    } else if (entry.isFile() && isApprovedSourceFile(relative)) files.push(relative);
  }
  for (const required of prefix ? [] : ['app.js', 'styles.css', 'assets/favicon.svg']) {
    if (!files.includes(required)) throw new Error(`Required asset missing: ${required}`);
  }
  return files.sort();
}

function publicPath(file) {
  return file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;
}

function validatePages(pages) {
  if (!Array.isArray(pages)) throw new Error('renderPages must return an array of { path, html }');
  const paths = new Set();
  for (const page of pages) {
    if (!page || typeof page.path !== 'string' || typeof page.html !== 'string') {
      throw new Error('Each page needs a path and HTML string');
    }
    if (!/^(?:[a-z0-9][a-z0-9-]*\/)*(?:index|404)\.html$/.test(page.path)) {
      throw new Error(`Invalid page path: ${page.path}`);
    }
    if (paths.has(page.path)) throw new Error(`Duplicate output path: ${page.path}`);
    paths.add(page.path);
    if (!/<!doctype html>/i.test(page.html) || !/<html\b[^>]*lang=["']ko["']/i.test(page.html)) {
      throw new Error(`Incomplete Korean HTML document: ${page.path}`);
    }
    if (privateReference.test(page.html) || /\.pdf(?:["'#?\s<]|$)/i.test(page.html)) {
      throw new Error(`Private/local/temporary reference in page: ${page.path}`);
    }
  }
  for (const name of requiredPages) {
    if (!paths.has(name)) throw new Error(`Required page missing: ${name}`);
  }
}

async function inventory(folder, prefix = '') {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected output symlink: ${relative}`);
    if (entry.isDirectory()) files.push(...await inventory(absolute, relative));
    else {
      const bytes = await readFile(absolute);
      if (bytes.length === 0) throw new Error(`Empty output: ${relative}`);
      files.push({ file: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  return files.sort((a, b) => a.file.localeCompare(b.file, 'en'));
}

async function replaceOutput(next, output, previous) {
  await mkdir(path.dirname(previous), { recursive: true });
  await rm(previous, { recursive: true, force: true });
  let movedOldOutput = false;
  try {
    const current = await lstat(output).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (current) {
      if (!current.isDirectory() || current.isSymbolicLink()) throw new Error(`Output must be a directory: ${output}`);
      await rename(output, previous);
      movedOldOutput = true;
    }
    await rename(next, output);
  } catch (error) {
    if (movedOldOutput) await rename(previous, output);
    throw error;
  }
  await rm(previous, { recursive: true, force: true });
}

export async function buildSite({ publicBuild = false } = {}) {
  const outputName = publicBuild ? 'public-dist' : 'dist';
  const output = path.join(root, outputName);
  const next = path.join(root, `.${outputName}-next`);
  const { renderPages } = await import('../site/render.mjs');
  const pages = await renderPages({ publicBuild });
  validatePages(pages);
  const assets = await sourceFiles();
  const stylesheet = await bundleStyles(source);
  if (privateReference.test(stylesheet) || /sourceMappingURL\s*=/.test(stylesheet)) {
    throw new Error('Private/local/temporary reference in bundled styles');
  }

  await rm(next, { recursive: true, force: true });
  await mkdir(next, { recursive: true });
  try {
    for (const file of assets) {
      const sourcePath = path.join(source, file);
      if (file === 'styles.css') {
        await writeFile(path.join(next, file), stylesheet);
        continue;
      }
      if (['.js', '.css', '.svg'].includes(path.extname(file))) {
        const text = await readFile(sourcePath, 'utf8');
        if (privateReference.test(text) || /sourceMappingURL\s*=/.test(text)) {
          throw new Error(`Private/local/temporary reference in asset: ${file}`);
        }
      }
      await mkdir(path.dirname(path.join(next, file)), { recursive: true });
      await copyFile(sourcePath, path.join(next, file));
    }
    for (const page of pages) {
      await mkdir(path.dirname(path.join(next, page.path)), { recursive: true });
      await writeFile(path.join(next, page.path), page.html);
    }
    const urls = pages.filter(page => page.path !== '404.html').map(page => `${origin}${publicPath(page.path)}`);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
    await writeFile(path.join(next, 'robots.txt'), publicBuild
      ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n');
    await writeFile(path.join(next, 'sitemap.xml'), sitemap);
    await writeFile(path.join(next, '_headers'), securityHeaders);

    const files = await inventory(next);
    const manifest = { files, totalBytes: files.reduce((total, file) => total + file.bytes, 0) };
    await replaceOutput(next, output, path.join(root, '.runtime/build', `${outputName}-previous`));
    if (publicBuild) {
      const manifestPath = path.join(root, '.runtime/deploy/public-manifest.json');
      await mkdir(path.dirname(manifestPath), { recursive: true });
      await writeFile(`${manifestPath}.next`, `${JSON.stringify(manifest, null, 2)}\n`);
      await rename(`${manifestPath}.next`, manifestPath);
    }
    console.log(JSON.stringify({ output, pages: pages.map(page => publicPath(page.path)), files: files.length, totalBytes: manifest.totalBytes }, null, 2));
    return manifest;
  } catch (error) {
    await rm(next, { recursive: true, force: true });
    throw error;
  }
}
