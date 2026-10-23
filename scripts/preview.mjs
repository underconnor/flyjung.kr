import { createServer } from 'node:http';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function inspectPath(root, segments) {
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    const info = await lstat(current).catch(error => {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
      throw error;
    });
    if (!info || info.isSymbolicLink()) return null;
  }
  const resolved = await realpath(current);
  const relative = path.relative(root, resolved);
  if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) return null;
  return { filename: resolved, info: await lstat(resolved) };
}

export async function createPreviewServer({ rootDirectory }) {
  const rootInfo = await lstat(rootDirectory);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('Preview output must be a real directory');
  const root = await realpath(rootDirectory);

  return createServer(async (request, response) => {
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    };
    function send(status, content, type = 'text/plain; charset=utf-8', extra = {}) {
      const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
      response.writeHead(status, { ...headers, 'Content-Type': type, 'Content-Length': bytes.length, ...extra });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    }
    async function notFound() {
      try {
        const page = await inspectPath(root, ['404.html']);
        if (page?.info.isFile()) return send(404, await readFile(page.filename), mimeTypes['.html']);
      } catch {
        // A build may replace the output between requests. Keep the fallback usable.
      }
      send(404, '페이지를 찾을 수 없습니다.');
    }

    try {
      if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Method not allowed', undefined, { Allow: 'GET, HEAD' });
      const target = request.url || '/';
      if (!target.startsWith('/') || target.startsWith('//') || target.includes('#')) return send(400, 'Invalid request path');
      const queryStart = target.indexOf('?');
      const rawPath = queryStart === -1 ? target : target.slice(0, queryStart);
      const query = queryStart === -1 ? '' : target.slice(queryStart);
      let pathname;
      try { pathname = decodeURIComponent(rawPath); } catch { return send(400, 'Invalid request path'); }
      if (/[\\\0-\x1f\x7f]/.test(pathname)) return send(400, 'Invalid request path');
      const segments = pathname.split('/').filter(Boolean);
      if (segments.some(segment => segment.startsWith('.') || segment === '_headers' || segment === '_redirects')) return notFound();
      let file = await inspectPath(root, segments);
      if (!file) return notFound();
      if (file.info.isDirectory()) {
        file = await inspectPath(root, [...segments, 'index.html']);
        if (!file?.info.isFile()) return notFound();
        if (!pathname.endsWith('/')) {
          const location = `/${segments.map(segment => encodeURIComponent(segment)).join('/')}/${query}`;
          return send(308, '', undefined, { Location: location });
        }
      }
      if (!file.info.isFile()) return notFound();
      const type = mimeTypes[path.extname(file.filename).toLowerCase()];
      if (!type) return notFound();
      send(200, await readFile(file.filename), type);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return notFound();
      if (!response.headersSent) send(500, '미리보기 파일을 읽을 수 없습니다.');
      else response.destroy();
    }
  });
}

async function run() {
  const args = process.argv.slice(2);
  let publicBuild = false;
  let conceptBuild = false;
  let selectedPort;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--public') publicBuild = true;
    else if (args[index] === '--concept') conceptBuild = true;
    else if (args[index] === '--port') selectedPort = Number(args[++index]);
    else throw new Error(`Unknown preview option: ${args[index]}`);
  }
  if (publicBuild && conceptBuild) throw new Error('Choose either the public build or the concept preview');
  const port = selectedPort ?? (conceptBuild ? 4321 : publicBuild ? 4319 : 4318);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be between 1 and 65535');
  const rootDirectory = path.join(projectRoot, conceptBuild ? 'concept-dist' : publicBuild ? 'public-dist' : 'dist');
  const index = await lstat(path.join(rootDirectory, 'index.html')).catch(() => null);
  if (!index?.isFile()) throw new Error(`먼저 npm run ${conceptBuild ? 'build:concept' : publicBuild ? 'check:public' : 'check'}로 사이트를 빌드해 주세요.`);
  const server = await createPreviewServer({ rootDirectory });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  console.log(`미리보기: http://127.0.0.1:${port}/ (종료: Ctrl+C)`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error(error.code === 'EADDRINUSE' ? '미리보기 포트가 이미 사용 중입니다. 기존 프로세스를 종료하지 않았습니다.' : error.message);
    process.exitCode = 1;
  });
}
