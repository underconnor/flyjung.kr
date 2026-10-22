import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPreviewServer } from './preview.mjs';

let temporary;
let server;
let port;
let supportsSymlinks = true;

before(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), 'flyjung-preview-'));
  const output = path.join(temporary, 'output');
  await mkdir(path.join(output, 'projects'), { recursive: true });
  await mkdir(path.join(output, 'assets'), { recursive: true });
  await mkdir(path.join(output, 'empty'), { recursive: true });
  await Promise.all([
    writeFile(path.join(output, 'index.html'), '<h1>Home</h1>'),
    writeFile(path.join(output, 'projects/index.html'), '<h1>Projects</h1>'),
    writeFile(path.join(output, '404.html'), '<h1>Custom not found</h1>'),
    writeFile(path.join(output, 'styles.css'), 'body { color: black; }'),
    writeFile(path.join(output, 'app.js'), 'export const ready = true;'),
    writeFile(path.join(output, 'assets/font.woff2'), Buffer.from([0, 1, 2, 255])),
    writeFile(path.join(output, '.hidden'), 'PRIVATE_HIDDEN'),
    writeFile(path.join(output, '_headers'), 'PRIVATE_CONFIGURATION'),
    writeFile(path.join(temporary, 'private.txt'), 'PRIVATE_OUTSIDE_ROOT'),
  ]);
  try {
    await symlink(path.join(temporary, 'private.txt'), path.join(output, 'linked.txt'));
    await symlink(temporary, path.join(output, 'linked-directory'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') supportsSymlinks = false;
    else throw error;
  }
  server = await createPreviewServer({ rootDirectory: output });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  port = server.address().port;
});

after(async () => {
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});

function get(rawPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: rawPath, method, headers: { Connection: 'close' } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('preview serves page routes and redirects directories with the query preserved', async () => {
  assert.equal(server.address().address, '127.0.0.1');
  const home = await get('/');
  assert.equal(home.status, 200);
  assert.equal(home.body.toString(), '<h1>Home</h1>');
  assert.match(home.headers['content-type'], /^text\/html/);
  const redirect = await get('/projects?q=hello');
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.location, '/projects/?q=hello');
  assert.equal((await get('/projects/')).body.toString(), '<h1>Projects</h1>');
});

test('preview serves scripts, styles, and binary fonts with correct types and HEAD semantics', async () => {
  for (const [url, expectedType] of [['/styles.css', 'text/css'], ['/app.js', 'text/javascript'], ['/assets/font.woff2', 'font/woff2']]) {
    const response = await get(url);
    assert.equal(response.status, 200);
    assert.ok(response.headers['content-type'].startsWith(expectedType), url);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['cache-control'], 'no-store');
    const head = await get(url, 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers['content-length']), response.body.length);
  }
});

test('preview returns a real custom 404 and never lists directories or hidden configuration', async () => {
  for (const url of ['/missing/', '/empty/', '/.hidden', '/_headers', '/.git/config']) {
    const response = await get(url);
    assert.equal(response.status, 404, url);
    assert.equal(response.body.toString(), '<h1>Custom not found</h1>', url);
    assert.doesNotMatch(response.body.toString(), /PRIVATE_|Index of/);
  }
});

test('preview rejects raw and encoded traversal, malformed paths, and write methods', async () => {
  for (const url of ['/../private.txt', '/%2e%2e/private.txt', '/%2e%2e%2fprivate.txt', '/%5c..%5cprivate.txt', '/%00', '/%ZZ']) {
    const response = await get(url);
    assert.ok([400, 404].includes(response.status), url);
    assert.doesNotMatch(response.body.toString(), /PRIVATE_OUTSIDE_ROOT/);
  }
  const write = await get('/index.html', 'POST');
  assert.equal(write.status, 405);
  assert.equal(write.headers.allow, 'GET, HEAD');
});

test('preview does not follow file or directory symlinks outside its output', async context => {
  if (!supportsSymlinks) return context.skip('Creating test symlinks requires additional Windows permissions');
  for (const url of ['/linked.txt', '/linked-directory/private.txt']) {
    const response = await get(url);
    assert.equal(response.status, 404, url);
    assert.doesNotMatch(response.body.toString(), /PRIVATE_OUTSIDE_ROOT/);
  }
});
