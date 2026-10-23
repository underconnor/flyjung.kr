import { createServer } from 'node:http';
import { lstat, mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogCategories, loadBlogPosts, validatePublishedPost } from '../site/data/blog.mjs';
import { renderBlogPost } from '../site/pages/blog.mjs';
import { escapeHTML } from '../site/html.mjs';
import { bundleStyles } from './bundle-styles.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const draftId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const limit = 512 * 1024;
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const fail = (status, message) => Object.assign(new Error(message), { status });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
const fingerprint = post => createHash('sha256').update(JSON.stringify(post)).digest('hex');

async function ensureDirectory(folder) {
  await mkdir(folder, { recursive: true });
  const info = await lstat(folder);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Writing storage must be a real directory: ${folder}`);
}

async function readJSON(filename) {
  const info = await lstat(filename).catch(error => {
    if (error.code === 'ENOENT') throw fail(404, '글을 찾을 수 없습니다. 목록을 새로고침해 주세요.');
    throw error;
  });
  if (!info.isFile() || info.isSymbolicLink()) throw fail(400, '일반 글 파일만 열 수 있습니다.');
  return JSON.parse(await readFile(filename, 'utf8'));
}

async function writeJSON(filename, value) {
  const current = await lstat(filename).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (current && (!current.isFile() || current.isSymbolicLink())) throw fail(400, '일반 글 파일만 저장할 수 있습니다.');
  const temporary = `${filename}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await rename(temporary, filename);
  } finally {
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

function contentFields(input) {
  const fields = {};
  for (const [key, maxLength] of Object.entries({ title: 240, slug: 120, category: 50, date: 10, summary: 1000, body: 250000 })) {
    if (typeof input[key] !== 'string' || input[key].length > maxLength) throw fail(400, `${key}: 입력 길이와 형식을 확인해 주세요.`);
    fields[key] = key === 'body' ? input[key].replaceAll('\r\n', '\n') : input[key].trim();
  }
  if (fields.slug && !slugPattern.test(fields.slug)) throw fail(400, '글 주소에는 영문 소문자·숫자·하이픈을 사용해 주세요.');
  if (!blogCategories.some(category => category.id !== 'all' && category.id === fields.category)) throw fail(400, '글 분류를 선택해 주세요.');
  return fields;
}

function publicPost(draft, { checkPublicReferences = true } = {}) {
  const post = {
    slug: draft.slug, title: draft.title, category: draft.category, date: draft.date,
    summary: draft.summary, paragraphs: draft.body.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean), status: 'published',
  };
  try { validatePublishedPost(post); } catch {
    throw fail(400, '제목·글 주소·분류·날짜·본문을 모두 입력해 주세요. 날짜는 실제 날짜여야 합니다.');
  }
  const allText = JSON.stringify(post);
  if (checkPublicReferences && (/portfolio-original|\/Users\/|127\.0\.0\.1|localhost|_workspace|research-evidence|https?:\/\/(?:www\.)?figma\.com\/api\/mcp\/asset\//i.test(allText) || /\.pdf(?:["'#?\s<]|$)/i.test(allText))) {
    throw fail(400, '원본 PDF·로컬 경로·비공개 자료 주소는 공개 글에 포함할 수 없습니다.');
  }
  return post;
}

async function readBody(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw fail(415, 'JSON 요청만 처리할 수 있습니다.');
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw fail(413, '글이 너무 큽니다. 본문 길이를 줄여 주세요.');
    chunks.push(chunk);
  }
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
    return input;
  } catch { throw fail(400, '요청 내용을 읽을 수 없습니다.'); }
}

export async function createEditorServer({ storageRoot = projectRoot } = {}) {
  // Check each level so an existing local symlink cannot redirect draft/public writes.
  await ensureDirectory(storageRoot);
  for (const folder of ['.runtime', '.runtime/writing', '.runtime/writing/drafts', 'content', 'content/posts']) {
    await ensureDirectory(path.join(storageRoot, folder));
  }
  const draftsDirectory = path.join(storageRoot, '.runtime/writing/drafts');
  const postsDirectory = path.join(storageRoot, 'content/posts');
  const draftFile = id => {
    if (!draftId.test(id)) throw fail(404, '글을 찾을 수 없습니다.');
    return path.join(draftsDirectory, `${id}.json`);
  };
  const postFile = slug => {
    if (!slugPattern.test(slug) || slug.length > 120) throw fail(400, '글 주소가 올바르지 않습니다.');
    return path.join(postsDirectory, `${slug}.json`);
  };
  const newDraft = post => ({
    id: randomUUID(), revision: 1, sourceSlug: post?.slug || null, sourceFingerprint: post ? fingerprint(post) : null, title: post?.title || '',
    slug: post?.slug || '', category: post?.category || 'notes', date: post?.date || today(),
    summary: post?.summary || '', body: post?.paragraphs.join('\n\n') || '', updatedAt: new Date().toISOString(),
  });
  // A single writer prevents two tabs from silently overwriting each other.
  let pendingWrite = Promise.resolve();
  const serialize = action => {
    const next = pendingWrite.then(action);
    pendingWrite = next.catch(() => {});
    return next;
  };

  const server = createServer(async (request, response) => {
    const send = (status, content, type = 'application/json; charset=utf-8') => {
      const bytes = Buffer.isBuffer(content) ? content : Buffer.from(type.startsWith('application/json') ? JSON.stringify(content) : content);
      response.writeHead(status, {
        'Content-Type': type, 'Content-Length': bytes.length, 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self' about:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    };
    try {
      const address = server.address();
      const host = `127.0.0.1:${address.port}`;
      const origin = `http://${host}`;
      if (request.headers.host !== host || (request.headers.origin && request.headers.origin !== origin) || request.headers['sec-fetch-site'] === 'cross-site') {
        throw fail(403, '이 컴퓨터의 글쓰기 화면에서만 사용할 수 있습니다.');
      }
      const isWrite = !['GET', 'HEAD'].includes(request.method);
      if (isWrite && request.headers.origin !== origin) throw fail(403, '글쓰기 화면에서 다시 시도해 주세요.');
      const target = request.url || '/';
      if (!target.startsWith('/') || target.startsWith('//') || /[\\\0]/.test(target)) throw fail(400, '요청 주소가 올바르지 않습니다.');
      const pathname = new URL(target, origin).pathname;

      if (request.method === 'GET' && pathname === '/api/items') {
        await pendingWrite;
        const drafts = [];
        for (const entry of await readdir(draftsDirectory)) {
          if (!entry.endsWith('.json')) continue;
          const id = entry.slice(0, -5);
          drafts.push(await readJSON(draftFile(id)));
        }
        const posts = await loadBlogPosts(postsDirectory);
        return send(200, { drafts: drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), posts, categories: blogCategories.filter(category => category.id !== 'all') });
      }
      if (request.method === 'GET' && pathname.startsWith('/api/drafts/')) {
        await pendingWrite;
        return send(200, await readJSON(draftFile(pathname.slice('/api/drafts/'.length))));
      }
      if (isWrite && pathname.startsWith('/api/')) {
        const input = await readBody(request);
        const result = await serialize(async () => {
          if (request.method === 'POST' && pathname === '/api/drafts') {
            const post = input.sourceSlug ? await readJSON(postFile(input.sourceSlug)) : null;
            if (post) validatePublishedPost(post);
            const draft = newDraft(post);
            await writeJSON(draftFile(draft.id), draft);
            return { status: 201, value: draft };
          }
          const match = pathname.match(/^\/api\/drafts\/([^/]+)(?:\/(preview|publish))?$/);
          if (match) {
            const draft = await readJSON(draftFile(match[1]));
            if (request.method === 'PUT' && !match[2]) {
              if (input.revision !== draft.revision) throw fail(409, '다른 창에서 바뀐 글입니다. 다시 열어 최신 내용을 확인해 주세요.');
              const fields = contentFields(input);
              if (draft.sourceSlug && fields.slug !== draft.sourceSlug) throw fail(400, '배포 대상으로 등록한 글의 주소는 바꿀 수 없습니다.');
              const saved = { ...draft, ...fields, revision: draft.revision + 1, updatedAt: new Date().toISOString() };
              await writeJSON(draftFile(draft.id), saved);
              return { status: 200, value: saved };
            }
            if (request.method === 'POST' && match[2] === 'preview') {
              const fields = contentFields(input);
              const post = publicPost({ ...draft, ...fields, slug: fields.slug || 'draft-preview' }, { checkPublicReferences: false });
              const html = `<!doctype html><html lang="ko" data-page="article"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHTML(post.title)} 미리보기</title><link rel="stylesheet" href="/preview.css"></head><body class="inner-page" data-page="article"><main class="page-width">${renderBlogPost(post, { preview: true })}</main></body></html>`;
              return { status: 200, value: { html } };
            }
            if (request.method === 'POST' && match[2] === 'publish') {
              if (input.confirm !== true) throw fail(400, '배포 대상 등록을 먼저 확인해 주세요.');
              if (input.revision !== draft.revision) throw fail(409, '글이 바뀌었습니다. 저장한 내용을 다시 확인해 주세요.');
              const post = publicPost(draft);
              const existing = await lstat(postFile(post.slug)).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
              if (existing && draft.sourceSlug !== post.slug) throw fail(409, '이미 쓰고 있는 글 주소입니다. 다른 주소를 입력해 주세요.');
              if (draft.sourceSlug && (!existing || fingerprint(await readJSON(postFile(post.slug))) !== draft.sourceFingerprint)) {
                throw fail(409, '등록된 글이 다른 곳에서 바뀌었습니다. 배포 대상 목록에서 다시 열어 수정해 주세요. 현재 초안은 보관됩니다.');
              }
              await writeJSON(postFile(post.slug), post);
              const saved = { ...draft, sourceSlug: post.slug, sourceFingerprint: fingerprint(post), revision: draft.revision + 1, updatedAt: new Date().toISOString() };
              await writeJSON(draftFile(draft.id), saved);
              return { status: 200, value: { draft: saved, post } };
            }
          }
          const withdraw = pathname.match(/^\/api\/posts\/([^/]+)\/withdraw$/);
          if (request.method === 'POST' && withdraw) {
            if (input.confirm !== true) throw fail(400, '배포 대상에서 제외할지 먼저 확인해 주세요.');
            const filename = postFile(withdraw[1]);
            const post = await readJSON(filename);
            validatePublishedPost(post);
            if (input.sourceFingerprint !== fingerprint(post)) throw fail(409, '등록된 글이 바뀌었습니다. 배포 대상 목록에서 다시 열어 확인해 주세요.');
            const draft = { ...newDraft(post), sourceSlug: null, sourceFingerprint: null };
            await writeJSON(draftFile(draft.id), draft);
            await unlink(filename);
            return { status: 200, value: { draft } };
          }
          throw fail(404, '요청한 기능을 찾을 수 없습니다.');
        });
        return send(result.status, result.value);
      }
      if (['GET', 'HEAD'].includes(request.method)) {
        const assets = { '/': 'index.html', '/editor.js': 'editor.js', '/editor.css': 'editor.css' };
        if (assets[pathname]) {
          const name = assets[pathname];
          return send(200, await readFile(path.join(projectRoot, 'editor', name)), mimeTypes[path.extname(name)]);
        }
        if (pathname === '/preview.css') return send(200, await bundleStyles(path.join(projectRoot, 'src')), mimeTypes['.css']);
        if (pathname === '/favicon.svg') return send(200, await readFile(path.join(projectRoot, 'src/assets/favicon.svg')), 'image/svg+xml');
        if (/^\/assets\/fonts\/noto-sans-kr-\d{3}\.woff2$/.test(pathname)) {
          return send(200, await readFile(path.join(projectRoot, 'src', pathname)), 'font/woff2');
        }
      }
      throw fail(404, '요청한 화면을 찾을 수 없습니다.');
    } catch (error) {
      if (!response.headersSent) send(error.status || 500, { error: error.status ? error.message : '파일을 처리하지 못했습니다. 터미널을 확인해 주세요.' });
      if (!error.status) console.error(error);
    }
  });
  return server;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--port')) throw new Error('사용법: node scripts/editor.mjs [--port 4320]');
  const port = args.length ? Number(args[1]) : 4320;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('포트는 1~65535 사이여야 합니다.');
  const server = await createEditorServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  console.log(`글쓰기: http://127.0.0.1:${port}/\n초안은 이 컴퓨터에만 저장됩니다. 배포 대상 등록 후에도 실제 사이트 반영에는 별도 배포가 필요합니다.\n종료: Ctrl+C`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.code === 'EADDRINUSE' ? '글쓰기 포트가 이미 사용 중입니다. 기존 서버를 종료하지 않았습니다.' : error.message); process.exitCode = 1; });
}
