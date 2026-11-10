import { renderMetadata } from './metadata.mjs';
import { renderSiteHeader, renderSiteFooter, renderPageTrail } from './chrome.mjs';
export function layout({title,description,body,page,publicBuild=false,pathname='/',noindex=false}) {
  const isHome=page==='home';
  const footer=renderSiteFooter({page});
  return `<!doctype html>
<html lang="ko" data-page="${page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${publicBuild&&!noindex?'index,follow':'noindex,nofollow'}">
<meta name="theme-color" content="#eef3f8">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
${renderMetadata({pathname,description})}
<link rel="icon" href="/assets/favicon.svg?v=jiwon-dot-20261109" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<script src="/scripts/page-flow.js"></script>
<script type="module" src="/app.js" blocking="render"></script>
</head>
<body class="${isHome?'home':'inner-page'}" data-page="${page}">
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
${renderSiteHeader({page})}
<main class="page-width" id="main" tabindex="-1">${renderPageTrail({page,title})}${body}</main>
${footer}
</body></html>`;
}
