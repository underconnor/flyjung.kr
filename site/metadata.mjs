import { escapeHTML as e } from './html.mjs';

export const siteName = 'flyjung.';
export const personName = 'Jiwon Jung';
export const signature = 'Per aspera ad astra.';
export const siteOrigin = 'https://flyjung.kr';
export const siteDescription = `${personName} — ${signature}`;

export function renderMetadata({ pathname = '/', description = siteDescription, concept = false } = {}) {
  const url = siteOrigin + pathname;
  return `<title>${e(siteName)}</title>
<meta name="description" content="${e(description)}">
<meta name="author" content="${e(personName)}">
<meta name="application-name" content="${e(siteName)}">
<meta property="og:site_name" content="${e(siteName)}">
<meta property="og:title" content="${e(siteName)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${e(siteName)}">
<meta name="twitter:description" content="${e(description)}">${concept ? '' : `
<link rel="canonical" href="${e(url)}">
<meta property="og:url" content="${e(url)}">`}`;
}

// WebSite microdata stays in the home page's scope and needs no inline script.
export function renderSiteNameProperties() {
  return `<meta itemprop="name" content="${e(siteName)}"><link itemprop="url" href="${siteOrigin}/">`;
}
