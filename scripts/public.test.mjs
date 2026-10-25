import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../public-dist/', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('../.runtime/deploy/public-manifest.json', import.meta.url), 'utf8'));
async function list(folder, prefix = '') {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `Public symlink: ${entry.name}`);
    const name = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await list(path.join(folder, entry.name), name));
    else files.push(name);
  }
  return files;
}
const files = await list(root);
const routeFor = file => file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1];
}

test('public manifest covers every deployed file and verifies its bytes', async () => {
  assert.equal(new Set(manifest.files.map(file => file.file)).size, manifest.files.length);
  assert.deepEqual([...files].sort(), manifest.files.map(file => file.file).sort());
  let total = 0;
  for (const entry of manifest.files) {
    const content = await readFile(path.join(root, entry.file));
    assert.equal(content.length, entry.bytes, entry.file);
    assert.equal(createHash('sha256').update(content).digest('hex'), entry.sha256, entry.file);
    total += content.length;
  }
  assert.equal(total, manifest.totalBytes);
});

test('public indexing matches each real route and excludes the 404 page', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
  const expectedUrls = [];
  for (const name of files.filter(file => file.endsWith('.html'))) {
    const html = await readFile(path.join(root, name), 'utf8');
    const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]).find(tag => attribute(tag, 'name') === 'robots');
    assert.ok(meta, `${name}: robots declaration`);
    if (name === '404.html') {
      assert.match(attribute(meta, 'content'), /noindex/);
      continue;
    }
    assert.equal(attribute(meta, 'content'), 'index,follow', name);
    const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]).find(tag => attribute(tag, 'rel') === 'canonical');
    const expected = `https://flyjung.kr${routeFor(name)}`;
    assert.equal(attribute(canonical || '', 'href'), expected, name);
    expectedUrls.push(expected);
  }
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort(), expectedUrls.sort());
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Sitemap: https:\/\/flyjung\.kr\/sitemap\.xml/);
  assert.doesNotMatch(sitemap, /404\.html/);
});

test('public hosting policy keeps executable content and sensitive capabilities local', async () => {
  const headers = await readFile(path.join(root, '_headers'), 'utf8');
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /script-src 'self'/);
  assert.match(headers, /style-src 'self'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.doesNotMatch(headers, /unsafe-inline|unsafe-eval|Access-Control-Allow-Origin:\s*\*/);
  assert.ok(files.some(name => /^assets\/fonts\/.*OFL.*\.txt$/i.test(name)), 'Self-hosted fonts retain OFL licensing');
});

test('the published stylesheet needs no chained CSS requests and uses local font paths', async () => {
  const css = await readFile(path.join(root, 'styles.css'), 'utf8');
  assert.doesNotMatch(css, /@import\s/);
  assert.ok(!files.some(name => name.startsWith('styles/')), 'Only the bundled stylesheet is deployed');
  assert.match(css, /url\("\/assets\/fonts\/noto-sans-kr-/);
});

test('the public bundle excludes the writing workspace and comparison concept', async () => {
  assert.doesNotMatch(files.join('\n'), /(?:^|\/)(?:editor|content|experiments|concept-dist|drafts|flight-assets|flight|archive|aircraft|aircraft-v2|sky-engine|duck|hangar|terminal|indigo|horizon|daybreak|atmosphere|descent|orbit|flight-lab)(?:\/|$)|(?:^|\/)(?:concept|studio|flight|night|terminal|hangar|horizon|daybreak|atmosphere|descent|orbit|flight-lab|navigation)\.(?:css|js)$/m);
  for (const name of files.filter(file => /\.(?:html|js|css)$/.test(file))) {
    const text = await readFile(path.join(root, name), 'utf8');
    assert.doesNotMatch(text, /data-editor|slogan-select|\/api\/drafts|localhost:4320|127\.0\.0\.1:432[01]/, name);
  }
});
