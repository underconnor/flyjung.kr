import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, readFile, readdir, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createEditorServer } from './editor.mjs';
import { loadBlogPosts } from '../site/data/blog.mjs';

const content = {
  title: '직접 만든 앱의 기록',
  slug: 'a-project-note',
  category: 'projects',
  date: '2026-10-23',
  summary: '구현하며 선택한 내용을 남깁니다.',
  body: '첫 번째 문단입니다.\n한 문단 안의 줄바꿈입니다.\n\n두 번째 문단입니다.',
};

async function fixture(context) {
  const storageRoot = await mkdtemp(path.join(tmpdir(), 'flyjung-editor-'));
  let server;
  context.after(async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await rm(storageRoot, { recursive: true, force: true });
  });
  server = await createEditorServer({ storageRoot });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;
  const call = (url, { method = 'GET', data, headers = {} } = {}) => new Promise((resolve, reject) => {
    const payload = data === undefined ? undefined : JSON.stringify(data);
    const defaults = { Connection: 'close' };
    if (payload !== undefined) {
      defaults['Content-Type'] = 'application/json';
      defaults['Content-Length'] = Buffer.byteLength(payload);
      defaults.Origin = origin;
    }
    const combined = { ...defaults, ...headers };
    for (const name of Object.keys(combined)) if (combined[name] === undefined) delete combined[name];
    const req = request({ hostname: '127.0.0.1', port, path: url, method, headers: combined }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let json;
        try { json = JSON.parse(body); } catch { /* Static/error responses need not be JSON. */ }
        resolve({ status: response.statusCode, headers: response.headers, body, json });
      });
    });
    req.on('error', reject);
    req.end(payload);
  });
  const create = async (data = {}) => {
    const response = await call('/api/drafts', { method: 'POST', data });
    assert.ok([200, 201].includes(response.status), response.body);
    assert.ok(response.json?.id, response.body);
    return response.json;
  };
  const save = async (draft, fields = content) => {
    const response = await call(`/api/drafts/${draft.id}`, { method: 'PUT', data: { ...fields, revision: draft.revision } });
    assert.equal(response.status, 200, response.body);
    return response.json;
  };
  const publish = async draft => {
    const response = await call(`/api/drafts/${draft.id}/publish`, { method: 'POST', data: { revision: draft.revision, confirm: true } });
    assert.ok([200, 201].includes(response.status), response.body);
    return response.json;
  };
  return { storageRoot, server, origin, call, create, save, publish };
}

test('editor accepts only its loopback host and same-origin JSON writes', async context => {
  const { server, call } = await fixture(context);
  assert.equal(server.address().address, '127.0.0.1');
  assert.equal((await call('/api/items')).status, 200);
  for (const headers of [{ Host: 'attacker.example' }, { Origin: 'https://attacker.example' }, { Origin: 'null' }]) {
    assert.equal((await call('/api/items', { headers })).status, 403);
  }
  for (const headers of [{ Origin: undefined }, { Origin: 'https://attacker.example' }, { Origin: 'null' }, { Host: 'attacker.example' }]) {
    assert.equal((await call('/api/drafts', { method: 'POST', data: {}, headers })).status, 403);
  }
  const wrongType = await call('/api/drafts', { method: 'POST', data: {}, headers: { 'Content-Type': 'text/plain' } });
  assert.ok([400, 415].includes(wrongType.status));
  const items = await call('/api/items');
  assert.equal(items.json.drafts.length, 0, 'Rejected requests must not create files');
});

test('editor keeps saved drafts private and rejects stale revisions and unsafe paths', async context => {
  const { storageRoot, call, create, save } = await fixture(context);
  const original = await create();
  const saved = await save(original, { ...content, body: 'PRIVATE_DRAFT_TEST' });
  assert.ok(saved.revision > original.revision);
  const stored = await call(`/api/drafts/${saved.id}`);
  assert.equal(stored.json.body, 'PRIVATE_DRAFT_TEST');
  const stale = await call(`/api/drafts/${saved.id}`, { method: 'PUT', data: { ...content, body: 'STALE_WRITE', revision: original.revision } });
  assert.equal(stale.status, 409);
  assert.equal((await call(`/api/drafts/${saved.id}`)).json.body, 'PRIVATE_DRAFT_TEST');
  assert.deepEqual((await readdir(path.join(storageRoot, 'content/posts'))).filter(name => name.endsWith('.json')), []);
  assert.deepEqual(await loadBlogPosts(path.join(storageRoot, 'content/posts')), [], 'The public build must not read editor drafts');
  const listed = await call('/api/items');
  assert.equal(listed.json.drafts.length, 1);
  assert.equal(listed.json.posts.length, 0);
  for (const url of ['/../package.json', '/%2e%2e/package.json', '/api/drafts/%2e%2e%2fpackage', `/.runtime/writing/drafts/${saved.id}.json`, '/content/posts/', '/.git/config']) {
    const response = await call(url);
    assert.ok([400, 404].includes(response.status), `${url}: ${response.status}`);
    assert.doesNotMatch(response.body, /PRIVATE_DRAFT_TEST|STALE_WRITE/);
  }
});

test('editor preview escapes authored markup and does not save or publish it', async context => {
  const { storageRoot, call, create } = await fixture(context);
  const draft = await create();
  const before = await call(`/api/drafts/${draft.id}`);
  const preview = await call(`/api/drafts/${draft.id}/preview`, {
    method: 'POST', data: { ...content, title: '<script>alert(1)</script>', body: '<img src=x onerror=alert(1)>\n\n두 번째 문단', revision: draft.revision },
  });
  assert.equal(preview.status, 200, preview.body);
  assert.match(preview.json.html, /&lt;script&gt;/);
  assert.match(preview.json.html, /&lt;img/);
  assert.doesNotMatch(preview.json.html, /<script\b|<img\s+src=x/i);
  assert.match(preview.json.html, /blog-article/);
  assert.match(preview.json.html, /두 번째 문단/);
  const after = await call(`/api/drafts/${draft.id}`);
  assert.deepEqual(after.json, before.json);
  assert.equal((await readdir(path.join(storageRoot, 'content/posts'))).filter(name => name.endsWith('.json')).length, 0);
});

test('editor requires confirmation and complete content before adding a unique public post', async context => {
  const { storageRoot, call, create, save, publish } = await fixture(context);
  const empty = await create();
  const invalid = await call(`/api/drafts/${empty.id}/publish`, { method: 'POST', data: { revision: empty.revision, confirm: true } });
  assert.equal(invalid.status, 400, invalid.body);
  const draft = await save(empty);
  const noConfirmation = await call(`/api/drafts/${draft.id}/publish`, { method: 'POST', data: { revision: draft.revision } });
  assert.equal(noConfirmation.status, 400);
  const result = await publish(draft);
  assert.equal(result.post.status, 'published');
  const filename = path.join(storageRoot, `content/posts/${content.slug}.json`);
  const originalBytes = await readFile(filename, 'utf8');
  const stored = JSON.parse(originalBytes);
  assert.equal(stored.title, content.title);
  assert.deepEqual(stored.paragraphs, ['첫 번째 문단입니다.\n한 문단 안의 줄바꿈입니다.', '두 번째 문단입니다.']);
  assert.equal((await call('/api/items')).json.posts.length, 1);
  assert.deepEqual(await loadBlogPosts(path.join(storageRoot, 'content/posts')), [stored]);
  const duplicate = await save(await create(), { ...content, title: '다른 글' });
  const conflict = await call(`/api/drafts/${duplicate.id}/publish`, { method: 'POST', data: { revision: duplicate.revision, confirm: true } });
  assert.equal(conflict.status, 409);
  assert.equal(await readFile(filename, 'utf8'), originalBytes);
});

test('editing a public post stays a private draft until explicitly registered again', async context => {
  const { storageRoot, call, create, save, publish } = await fixture(context);
  await publish(await save(await create()));
  const filename = path.join(storageRoot, `content/posts/${content.slug}.json`);
  const originalPublic = await readFile(filename, 'utf8');
  const copy = await create({ sourceSlug: content.slug });
  assert.equal(copy.sourceSlug, content.slug);
  assert.equal(copy.body, content.body);
  const edited = await save(copy, { ...content, body: '새로 고친 비공개 문단' });
  assert.equal(await readFile(filename, 'utf8'), originalPublic);
  const rename = await call(`/api/drafts/${edited.id}`, { method: 'PUT', data: { ...content, slug: 'unintended-new-address', revision: edited.revision } });
  assert.ok([400, 409].includes(rename.status), rename.body);
  await publish(edited);
  const nextPublic = JSON.parse(await readFile(filename, 'utf8'));
  assert.deepEqual(nextPublic.paragraphs, ['새로 고친 비공개 문단']);
  assert.equal(nextPublic.slug, content.slug);
  assert.equal((await call('/api/items')).json.posts.length, 1);
});

test('withdrawing a registered post preserves its content as a local draft', async context => {
  const { storageRoot, call, create, save, publish } = await fixture(context);
  const published = await publish(await save(await create()));
  const noConfirmation = await call(`/api/posts/${content.slug}/withdraw`, { method: 'POST', data: {} });
  assert.equal(noConfirmation.status, 400);
  const response = await call(`/api/posts/${content.slug}/withdraw`, { method: 'POST', data: { confirm: true, sourceFingerprint: published.draft.sourceFingerprint } });
  assert.equal(response.status, 200, response.body);
  assert.equal(response.json.draft.body, content.body);
  assert.equal(response.json.draft.title, content.title);
  assert.equal((await call('/api/items')).json.posts.length, 0);
  await assert.rejects(readFile(path.join(storageRoot, `content/posts/${content.slug}.json`)), { code: 'ENOENT' });
  const restored = await call(`/api/drafts/${response.json.draft.id}`);
  assert.equal(restored.status, 200);
  assert.equal(restored.json.body, content.body);
});

test('older editing copies cannot overwrite or withdraw a newer public version', async context => {
  const { storageRoot, call, create, save, publish } = await fixture(context);
  const firstVersion = await publish(await save(await create()));
  assert.ok(firstVersion.draft.sourceFingerprint);
  const firstEditor = await create({ sourceSlug: content.slug });
  const secondEditor = await create({ sourceSlug: content.slug });
  const newer = await save(firstEditor, { ...content, body: '최신 등록본' });
  const older = await save(secondEditor, { ...content, body: '늦게 저장한 이전 편집본' });
  const latest = await publish(newer);
  const filename = path.join(storageRoot, `content/posts/${content.slug}.json`);
  const latestBytes = await readFile(filename, 'utf8');
  const stalePublish = await call(`/api/drafts/${older.id}/publish`, { method: 'POST', data: { revision: older.revision, confirm: true } });
  assert.equal(stalePublish.status, 409, stalePublish.body);
  const staleWithdraw = await call(`/api/posts/${content.slug}/withdraw`, { method: 'POST', data: { confirm: true, sourceFingerprint: firstVersion.draft.sourceFingerprint } });
  assert.equal(staleWithdraw.status, 409, staleWithdraw.body);
  assert.equal(await readFile(filename, 'utf8'), latestBytes);
  const withdraw = await call(`/api/posts/${content.slug}/withdraw`, { method: 'POST', data: { confirm: true, sourceFingerprint: latest.draft.sourceFingerprint } });
  assert.equal(withdraw.status, 200, withdraw.body);
  const resurrect = await call(`/api/drafts/${older.id}/publish`, { method: 'POST', data: { revision: older.revision, confirm: true } });
  assert.equal(resurrect.status, 409, resurrect.body);
  await assert.rejects(readFile(filename), { code: 'ENOENT' });
});

test('editor refuses public file symlinks without changing their outside target', async context => {
  const { storageRoot, call, create, save } = await fixture(context);
  const target = path.join(storageRoot, 'outside.json');
  const bytes = '{"private":"OUTSIDE_TARGET"}\n';
  await writeFile(target, bytes);
  try {
    await symlink(target, path.join(storageRoot, `content/posts/${content.slug}.json`));
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return context.skip('Creating test symlinks requires permission');
    throw error;
  }
  const draft = await save(await create());
  const response = await call(`/api/drafts/${draft.id}/publish`, { method: 'POST', data: { revision: draft.revision, confirm: true } });
  assert.ok(response.status >= 400, response.body);
  assert.doesNotMatch(response.body, /OUTSIDE_TARGET/);
  assert.equal(await readFile(target, 'utf8'), bytes);
});
