import { readFile } from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://flyjung.kr';
const imports = /@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)|"([^"]+)"|'([^']+)')\s*;/g;
const urls = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/g;

function localURL(reference, stylesheet) {
  const url = new URL(reference, `${origin}/${stylesheet}`);
  if (url.origin !== origin) throw new Error(`Styles must use local assets: ${reference}`);
  return url;
}

function normalizeURLs(css, stylesheet) {
  return css.replace(urls, (match, doubleQuoted, singleQuoted, bare) => {
    const reference = doubleQuoted ?? singleQuoted ?? bare;
    if (!reference || reference.startsWith('#')) return match;
    const url = localURL(reference, stylesheet);
    return `url("${url.pathname}${url.search}${url.hash}")`;
  });
}

/** Inline the split source styles while keeping the stylesheet readable. */
export async function bundleStyles(sourceDirectory) {
  async function inline(stylesheet, parents = []) {
    if (parents.includes(stylesheet)) throw new Error(`Circular stylesheet import: ${[...parents, stylesheet].join(' -> ')}`);
    if (stylesheet !== 'styles.css' && !/^styles\/[a-zA-Z0-9/_-]+\.css$/.test(stylesheet)) {
      throw new Error(`Stylesheet import must stay in src/styles: ${stylesheet}`);
    }
    const css = await readFile(path.join(sourceDirectory, stylesheet), 'utf8');
    const fragments = [`/* ${stylesheet} */\n`];
    let cursor = 0;
    for (const match of css.matchAll(imports)) {
      fragments.push(normalizeURLs(css.slice(cursor, match.index), stylesheet));
      const reference = match.slice(1).find(value => value !== undefined);
      const child = decodeURIComponent(localURL(reference, stylesheet).pathname).replace(/^\//, '');
      fragments.push(await inline(child, [...parents, stylesheet]));
      cursor = match.index + match[0].length;
    }
    fragments.push(normalizeURLs(css.slice(cursor), stylesheet));
    const result = fragments.join('\n');
    if (/@import\s/.test(result)) throw new Error(`Unsupported stylesheet import in ${stylesheet}`);
    return result;
  }
  return inline('styles.css');
}
