import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterPosts, normalizeBlogState, readBlogState } from '../src/scripts/blog.js';
import { blogCategories, getPublishedPosts } from '../site/data/blog.mjs';
import { renderBlog, renderBlogPost } from '../site/pages/blog.mjs';

const outputName = process.env.SITE_BUILD || 'dist';
assert.ok(['dist', 'public-dist'].includes(outputName), 'Unexpected test output directory');
const root = fileURLToPath(new URL(`../${outputName}/`, import.meta.url));
const origin = 'https://flyjung.kr';
async function inventory(folder, prefix = '') {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `Output symlink: ${entry.name}`);
    const name = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await inventory(path.join(folder, entry.name), name));
    else files.push(name);
  }
  return files;
}
const files = await inventory(root);
const fileSet = new Set(files);
const documents = new Map(await Promise.all(files.filter(name => name.endsWith('.html')).map(async name => [name, await readFile(path.join(root, name), 'utf8')])));
const ids = new Map([...documents].map(([name, html]) => [name, [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1])]));
const routeFor = file => file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;

function resolveReference(reference, from, fragment = false) {
  assert.ok(reference.trim(), `Empty reference in ${from}`);
  const url = new URL(reference.replaceAll('&amp;', '&'), `${origin}${routeFor(from)}`);
  if (url.origin !== origin) {
    assert.equal(url.protocol, 'https:', `Unsupported external URL: ${reference}`);
    return;
  }
  let name = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (!name || name.endsWith('/')) name += 'index.html';
  else if (!fileSet.has(name) && fileSet.has(`${name}/index.html`)) name += '/index.html';
  assert.ok(fileSet.has(name), `${from} references missing file: ${reference}`);
  if (fragment && url.hash && ids.has(name)) {
    const id = decodeURIComponent(url.hash.slice(1));
    assert.ok(ids.get(name).includes(id), `${from} references missing anchor: ${reference}`);
  }
}

test('all primary routes are complete semantic documents with unique targets', () => {
  for (const required of ['index.html', 'projects/index.html', 'blog/index.html', 'cv/index.html', '404.html']) assert.ok(documents.has(required), required);
  for (const [name, html] of documents) {
    assert.match(html, /<!doctype html>/i, name);
    assert.match(html, /<html\b[^>]*lang=["']ko["']/i, name);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: one page heading`);
    assert.equal((html.match(/<main\b/g) || []).length, 1, `${name}: one main landmark`);
    assert.equal(new Set(ids.get(name)).size, ids.get(name).length, `${name}: unique IDs`);
    for (const [, references] of html.matchAll(/\baria-(?:controls|labelledby|describedby)=["']([^"']+)["']/g)) {
      for (const id of references.split(/\s+/)) assert.ok(ids.get(name).includes(id), `${name}: missing ARIA target ${id}`);
    }
  }
});

test('navigation, stylesheets, scripts, and static images resolve', async () => {
  for (const [name, html] of documents) {
    for (const [, reference] of html.matchAll(/\b(?:href|src|action)=["']([^"']*)["']/g)) resolveReference(reference, name, true);
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) assert.match(tag, /\balt=["'][^"']*["']/, `${name}: image needs alt`);
    for (const [tag] of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)) assert.match(tag, /\brel=["'][^"']*\b(?:noopener|noreferrer)\b/, `${name}: external window isolation`);
  }
  for (const name of files.filter(file => file.endsWith('.css'))) {
    const css = await readFile(path.join(root, name), 'utf8');
    for (const [, reference] of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) resolveReference(reference, name);
    for (const [, reference] of css.matchAll(/@import\s+["']([^"']+)["']/g)) resolveReference(reference, name);
  }
  for (const name of files.filter(file => file.endsWith('.js'))) {
    const js = await readFile(path.join(root, name), 'utf8');
    for (const [, reference] of js.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g)) resolveReference(reference, name);
  }
});

test('website output excludes private documents and temporary design URLs', async () => {
  assert.doesNotMatch(files.join('\n'), /(?:^|\/)(?:\.[^/]+|docs|site|private|review|evidence|_workspace)(?:\/|$)|\.(?:pdf|md|map|json)$/im);
  for (const name of files) {
    const bytes = await readFile(path.join(root, name));
    assert.ok(bytes.length > 0, `${name} is empty`);
    if (!/\.(?:html|css|js|svg|xml|txt)$/.test(name)) continue;
    const text = bytes.toString('utf8');
    assert.doesNotMatch(text, /portfolio-original|\/Users\/|127\.0\.0\.1|localhost|_workspace|https?:\/\/(?:www\.)?figma\.com\/api\/mcp\/asset\//i, name);
    assert.doesNotMatch(text, /010[- ]?\d{3,4}[- ]?\d{4}|sourceMappingURL\s*=/, name);
  }
});

test('blog filtering combines category and normalized search terms', () => {
  const posts = [
    { title: '학교 앱 개발 기록', summary: 'Flutter 상태 관리', category: 'development' },
    { title: '학교 활동 기록', summary: '팀과 함께', category: 'notes' },
    { title: 'ＡＰＩ 설계', summary: '프로젝트 결정', category: 'projects' },
  ];
  assert.deepEqual(filterPosts(posts, { category: 'development', query: '학교 Flutter' }), [posts[0]]);
  assert.deepEqual(filterPosts(posts, { query: 'api' }), [posts[2]]);
  assert.deepEqual(filterPosts(posts, { category: 'notes', query: '없는 검색어' }), []);
  assert.deepEqual(normalizeBlogState({ category: 'invalid', query: '  ＡＰＩ  ' }), { category: 'all', query: 'API' });
  assert.deepEqual(readBlogState('?category=projects&q=API', new Set(blogCategories.map(category => category.id))), { category: 'projects', query: 'API' });
});

test('blog publication hides drafts and escapes authored text', () => {
  const draft = { slug: 'private-draft', title: 'PRIVATE_DRAFT_TEST', category: 'notes', date: '2026-10-22', status: 'draft' };
  const article = { slug: 'safe-post', title: '<script>alert(1)</script>', category: 'notes', date: '2026-10-21', status: 'published', paragraphs: ['<img src=x onerror=alert(1)>'] };
  const posts = [draft, article];
  assert.deepEqual(getPublishedPosts(posts), [article]);
  assert.equal(posts[0], draft, 'Publishing must not mutate the source list');
  assert.doesNotMatch(renderBlog({ posts }), /PRIVATE_DRAFT_TEST|<script>/);
  assert.match(renderBlog({ posts }), /&lt;script&gt;/);
  assert.throws(() => renderBlogPost(draft), /Draft/);
  assert.doesNotMatch(renderBlogPost(article), /<img\b|<script>/);
  assert.match(renderBlogPost(article), /&lt;img/);
});
