import { escapeHTML, routes } from './html.mjs';
function navigation(page, footer = false) {
  const links = footer ? [{href:'/',label:'Home',key:'home'},...routes.map(route=>({...route,label:route.key==='projects'?'Work':route.label}))] : routes;
  return links.map(route=>`<a href="${route.href}"${page===route.key?' aria-current="page"':''}>${route.label}</a>`).join('');
}
export function layout({title,description,body,page,publicBuild=false,pathname='/',noindex=false}) {
  const isHome=page==='home';
  const footer=isHome
    ? `<footer class="home-footer page-width"><div class="home-footer-content"><div class="home-footer-copy"><a href="/">flyjung.kr</a><p>© 2026 flyjung.kr</p></div><nav aria-label="하단 메뉴">${navigation(page,true)}</nav></div></footer>`
    : `<footer class="site-footer page-width"><a href="/">flyjung.kr</a><p>© 2026</p></footer>`;
  return `<!doctype html>
<html lang="ko" data-page="${page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHTML(description)}">
<meta name="robots" content="${publicBuild&&!noindex?'index,follow':'noindex,nofollow'}">
<meta name="theme-color" content="${isHome?'#f7f6f2':'#fcfcfa'}">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
<title>${escapeHTML(title)}</title>
<link rel="canonical" href="https://flyjung.kr${pathname}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHTML(title)}">
<meta property="og:description" content="${escapeHTML(description)}">
<meta property="og:url" content="https://flyjung.kr${pathname}">
<meta property="og:locale" content="ko_KR">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<script type="module" src="/app.js"></script>
</head>
<body class="${isHome?'home':'inner-page'}" data-page="${page}">
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
<header class="site-header page-width"><a class="brand" href="/" aria-label="flyjung.kr 홈">flyjung.kr</a><nav class="site-nav" aria-label="주요 메뉴">${navigation(page)}</nav></header>
<main class="page-width" id="main" tabindex="-1">${body}</main>
${footer}
</body></html>`;
}
