import { escapeHTML as e } from './html.mjs';

function siteLinks(page, siteRoot) {
  return [
    { key: 'cv', label: 'CV', href: siteRoot + '/cv/' },
    { key: 'projects', label: 'Projects', href: siteRoot + '/projects/' },
    { key: 'blog', label: 'Blog', href: siteRoot + '/blog/' },
  ].map(route => {
    const current = page === route.key ? 'page' : page === 'article' && route.key === 'blog' ? 'location' : '';
    return '<a href="' + e(route.href) + '"' + (current ? ' aria-current="' + current + '"' : '') + '>' + route.label + '</a>';
  }).join('');
}

function wordmark(href) {
  return '<a class="wordmark" href="' + e(href) + '" aria-label="flyjung 홈">flyjung<span aria-hidden="true">.</span></a>';
}

export function renderSiteHeader({ page = 'home', siteRoot = '', widthClass = 'page-width' } = {}) {
  return '<header class="site-header ' + e(widthClass) + '">' +
    wordmark(page === 'home' ? '#top' : siteRoot + '/') +
    '<nav class="site-nav" aria-label="주 메뉴">' + siteLinks(page, siteRoot) + '</nav></header>';
}

export function renderSiteFooter({ page = 'home', siteRoot = '', widthClass = 'page-width' } = {}) {
  const icons = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>',
    blog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m10 13 4-4m-6 6-1.5 1.5a3.54 3.54 0 0 1-5-5L6 7a3.54 3.54 0 0 1 5 0m2 10a3.54 3.54 0 0 0 5 0l4.5-4.5a3.54 3.54 0 0 0-5-5L16 9" transform="translate(1 0) scale(.9)"/></svg>',
    github: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  };
  const links = [
    { label: 'Email', href: 'mailto:flyjung@soongsil.ac.kr', icon: 'email' },
    { label: 'Blog', href: siteRoot + '/blog/', icon: 'blog' },
    { label: 'GitHub', href: 'https://github.com/underconnor', icon: 'github', external: true },
    { label: 'Instagram', href: 'https://www.instagram.com/ji.won_1204/', icon: 'instagram', external: true },
  ].map(link => '<li><a class="footer-follow-link" href="' + e(link.href) + '"' +
    (link.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + icons[link.icon] +
    '<span>' + e(link.label) + '</span>' + (link.external ? '<span class="footer-link-sr"> · 새 탭</span>' : '') + '</a></li>').join('');
  return '<footer class="site-footer ' + e(widthClass) + '">' +
    wordmark(page === 'home' ? '#top' : siteRoot + '/') +
    '<nav class="footer-follow" aria-label="Contact and links"><ul class="footer-links">' + links + '</ul></nav></footer>';
}

export function renderPageTrail({ page, title = '', siteRoot = '' } = {}) {
  if (!page || page === 'home') return '';
  const sections = { cv: 'cv', projects: 'all-projects' };
  const labels = { cv: 'CV', projects: 'Projects', blog: 'Blog', '404': '404' };
  const current = page === 'article' ? title.replace(/ — flyjung(?:\.kr|\.)$/, '') : labels[page];
  if (!current) return '';
  const home = siteRoot + '/#' + (sections[page] || 'top');
  const parent = page === 'article'
    ? '<li><a href="' + e(siteRoot + '/blog/') + '">Blog</a></li>'
    : '';
  return '<nav class="page-trail" aria-label="Breadcrumb"><ol>' +
    '<li><a href="' + e(home) + '"><span aria-hidden="true">←</span> Home</a></li>' + parent +
    '<li class="page-trail-current" aria-current="page"><span>' + e(current) + '</span></li>' +
    '</ol></nav>';
}
