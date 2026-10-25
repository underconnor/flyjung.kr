const map = document.querySelector('.orbit-map');
const stars = [...map.querySelectorAll('.record-star')];
function positionConnections() {
  const bounds = map.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  for (const line of map.querySelectorAll('line[data-from]')) {
    for (const [key, attribute] of [['from', '1'], ['to', '2']]) {
      const glyph = document.getElementById(line.dataset[key]).querySelector('.record-glyph').getBoundingClientRect();
      line.setAttribute(`x${attribute}`, ((glyph.x + glyph.width / 2 - bounds.x) / bounds.width * 100).toFixed(3));
      line.setAttribute(`y${attribute}`, ((glyph.y + glyph.height / 2 - bounds.y) / bounds.height * 100).toFixed(3));
    }
  }
}
const observer = new ResizeObserver(positionConnections); observer.observe(map);
document.fonts.ready.then(positionConnections);
for (const star of stars) {
  const activate = () => { map.dataset.active = star.dataset.group || ''; };
  star.addEventListener('pointerenter', activate); star.addEventListener('focus', activate);
  star.addEventListener('pointerleave', () => { map.dataset.active = map.querySelector(':focus')?.dataset.group || ''; });
  star.addEventListener('blur', () => { map.dataset.active = ''; });
}

const form = document.querySelector('.catalog-search');
const search = document.querySelector('#project-search');
const projects = [...document.querySelectorAll('[data-project]')];
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
function filter(updateURL = true) {
  const terms = normalize(search.value).split(' ').filter(Boolean); let count = 0;
  for (const project of projects) { project.hidden = !terms.every(term => normalize(project.dataset.search).includes(term)); if (!project.hidden) count++; }
  document.querySelector('.result-count').textContent = terms.length ? `${projects.length}개 중 ${count}개 프로젝트` : `${projects.length}개의 프로젝트`;
  document.querySelector('.empty-result').hidden = count !== 0;
  if (updateURL) { const url = new URL(location.href); search.value.trim() ? url.searchParams.set('q', search.value.trim()) : url.searchParams.delete('q'); history.replaceState(null, '', url); }
}
form.hidden = false; search.value = new URL(location.href).searchParams.get('q') || ''; filter(false);
search.addEventListener('input', () => filter());
form.addEventListener('submit', event => { event.preventDefault(); filter(); });
form.addEventListener('reset', event => { event.preventDefault(); search.value = ''; filter(); search.focus(); });
search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; filter(); } });
window.addEventListener('popstate', () => { search.value = new URL(location.href).searchParams.get('q') || ''; filter(false); revealFragment(); });
function revealFragment() { const target = document.getElementById(location.hash.slice(1)); if (target?.tagName === 'DETAILS' && !target.hidden) target.open = true; }
for (const link of document.querySelectorAll('[data-open-project]')) link.addEventListener('click', event => {
  const target = document.getElementById(link.dataset.openProject); if (!target) return;
  event.preventDefault(); if (target.hidden) { search.value = ''; filter(); } target.open = true;
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
  target.querySelector('summary').focus({preventScroll: true});
});
for (const link of stars.filter(star => !star.hasAttribute('data-open-project'))) link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1)); if (!target) return;
  event.preventDefault(); if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  target.focus({preventScroll: true}); target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center'});
});
window.addEventListener('hashchange', revealFragment); revealFragment();
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); const main = document.querySelector('#main'); main.focus(); main.scrollIntoView({behavior:'instant'}); });
let viewer;
try { const {createSkyViewer} = await import('/sky-engine/viewer.mjs'); const host = document.querySelector('#orbit-aircraft'); host.replaceChildren(); viewer = createSkyViewer(host, {mode: 'ascii', interactive: true}); }
catch { document.querySelector('#orbit-aircraft').textContent = '지금은 787을 불러올 수 없습니다.'; }
window.addEventListener('pagehide', event => { if (!event.persisted) { observer.disconnect(); viewer?.destroy(); } });
