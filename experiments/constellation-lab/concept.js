const stage = document.querySelector('.sky-stage');
const layoutButtons = [...document.querySelectorAll('[data-layout]')].filter(element => element.matches('button'));
const stars = [...document.querySelectorAll('[data-star]')];
const starById = new Map(stars.map(star => [star.dataset.star, star]));
const lineMap = [...document.querySelectorAll('[data-connect]')];
const lineLayer = document.querySelector('.constellation-lines');
const validLayouts = new Set(['sparse', 'records', 'wide', 'radar']);

function positionLines() {
  const bounds = stage.getBoundingClientRect();
  lineLayer.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
  for (const line of lineMap) {
    const [firstId, secondId] = line.dataset.connect.split(':');
    const first = starById.get(firstId);
    const second = starById.get(secondId);
    const layoutAllowed = !line.dataset.layouts || line.dataset.layouts.split(',').includes(stage.dataset.layout);
    const visible = layoutAllowed && first && second && !first.hidden && !second.hidden && first.getClientRects().length > 0 && second.getClientRects().length > 0;
    line.style.display = visible ? '' : 'none';
    if (!visible) continue;
    const a = first.querySelector('.star-dot').getBoundingClientRect();
    const b = second.querySelector('.star-dot').getBoundingClientRect();
    line.setAttribute('x1', String(a.left + a.width / 2 - bounds.left));
    line.setAttribute('y1', String(a.top + a.height / 2 - bounds.top));
    line.setAttribute('x2', String(b.left + b.width / 2 - bounds.left));
    line.setAttribute('y2', String(b.top + b.height / 2 - bounds.top));
  }
}

function highlightStar(id) {
  const related = new Set(id ? [id] : []);
  for (const line of lineMap) {
    const endpoints = line.dataset.connect.split(':');
    const active = Boolean(id && line.style.display !== 'none' && endpoints.includes(id));
    line.classList.toggle('is-related', active);
    if (active) endpoints.forEach(endpoint => related.add(endpoint));
  }
  for (const star of stars) star.classList.toggle('is-related', related.has(star.dataset.star));
  stage.classList.toggle('has-highlight', Boolean(id));
}

function restoreFocusedStar() {
  const focused = stars.find(star => star === document.activeElement && !star.hidden);
  highlightStar(focused?.dataset.star || null);
}

for (const star of stars) {
  star.addEventListener('mouseenter', () => highlightStar(star.dataset.star));
  star.addEventListener('mouseleave', restoreFocusedStar);
  star.addEventListener('focus', () => highlightStar(star.dataset.star));
  star.addEventListener('blur', () => highlightStar(null));
}

function setLayout(layout, updateURL = true) {
  const selected = validLayouts.has(layout) ? layout : 'records';
  stage.dataset.layout = selected;
  const labels = { sparse: '두 프로젝트의 별자리', records: '프로젝트와 활동의 별자리', wide: '프로젝트, 활동, 수상의 별자리', radar: '프로젝트와 활동을 표시한 레이더식 별자리' };
  stage.setAttribute('aria-label', labels[selected]);
  for (const button of layoutButtons) button.setAttribute('aria-pressed', String(button.dataset.layout === selected));
  for (const star of stars) star.hidden = !(star.dataset.show === 'all' || star.dataset.show.split(',').includes(selected));
  highlightStar(null);
  positionLines();
  if (updateURL) {
    const url = new URL(location.href);
    if (selected === 'records') url.searchParams.delete('sky');
    else url.searchParams.set('sky', selected);
    history.replaceState(null, '', url);
  }
}

for (const button of layoutButtons) button.addEventListener('click', () => setLayout(button.dataset.layout));
setLayout(new URL(location.href).searchParams.get('sky'), false);
const stageObserver = new ResizeObserver(positionLines);
stageObserver.observe(stage);
document.fonts?.ready.then(positionLines);

const searchForm = document.querySelector('.project-search');
const search = document.querySelector('#project-search');
const rows = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('#project-count');
const empty = document.querySelector('#project-empty');
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim();

function filter(updateURL = true) {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const row of rows) {
    row.hidden = !terms.every(term => normalize(row.dataset.search).includes(term));
    if (!row.hidden) visible++;
  }
  count.textContent = terms.length ? `${rows.length}개 중 ${visible}개 프로젝트` : `${rows.length}개의 프로젝트`;
  empty.hidden = visible !== 0;
  if (updateURL) {
    const url = new URL(location.href);
    if (search.value.trim()) url.searchParams.set('q', search.value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
}

searchForm.hidden = false;
search.value = new URL(location.href).searchParams.get('q') || '';
filter(false);
search.addEventListener('input', () => filter());
searchForm.addEventListener('submit', event => { event.preventDefault(); filter(); });
searchForm.addEventListener('reset', event => { event.preventDefault(); search.value = ''; filter(); search.focus(); });
search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; filter(); } });

function revealFragment() {
  const row = rows.find(project => `#${project.id}` === location.hash);
  if (row && !row.hidden) row.open = true;
}

for (const link of document.querySelectorAll('[data-open-project]')) link.addEventListener('click', event => {
  const row = document.getElementById(link.dataset.openProject);
  if (!row) return;
  event.preventDefault();
  if (row.hidden) { search.value = ''; filter(); }
  row.open = true;
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  row.querySelector('summary').focus({ preventScroll: true });
  row.scrollIntoView({ behavior: 'instant', block: 'start' });
});

for (const link of stars.filter(star => !star.dataset.openProject)) link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: 'instant', block: 'center' });
});

window.addEventListener('hashchange', revealFragment);
window.addEventListener('popstate', () => {
  const url = new URL(location.href);
  setLayout(url.searchParams.get('sky'), false);
  search.value = url.searchParams.get('q') || '';
  filter(false);
  revealFragment();
});
revealFragment();

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});

const host = document.querySelector('#lab-aircraft');
let viewer;
try {
  const { createSkyViewer } = await import('/sky-engine/viewer.mjs');
  host.replaceChildren();
  viewer = createSkyViewer(host, { mode: 'ascii', interactive: false });
  host.querySelector('.sky-viewer')?.setAttribute('aria-hidden', 'true');
} catch {
  host.textContent = '787';
}
window.addEventListener('pagehide', event => { if (!event.persisted) { stageObserver.disconnect(); viewer?.destroy(); } });
