const skyMap = document.querySelector('.sky-map');
const yearLine = document.querySelector('#year-line');
function placeYearLine() {
  const bounds = skyMap.getBoundingClientRect();
  const points = [...skyMap.querySelectorAll('.star-point')].map(star => {
    const point = star.getBoundingClientRect();
    return `${(point.x + point.width / 2 - bounds.x) / bounds.width * 100},${(point.y + point.height / 2 - bounds.y) / bounds.height * 100}`;
  });
  yearLine.setAttribute('points', points.join(' '));
}
new ResizeObserver(placeYearLine).observe(skyMap);
document.fonts.ready.then(placeYearLine);

const searchForm = document.querySelector('.catalog-search');
const search = document.querySelector('#project-search');
const projects = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('#catalog-count');
const empty = document.querySelector('#catalog-empty');
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
function filter(updateURL = true) {
  const terms = normalize(search.value).split(' ').filter(Boolean);
  let visible = 0;
  for (const row of projects) {
    const haystack = normalize(row.dataset.search);
    row.hidden = !terms.every(term => haystack.includes(term));
    if (!row.hidden) visible++;
  }
  count.textContent = terms.length ? `${projects.length}개 중 ${visible}개 프로젝트` : `${projects.length}개의 프로젝트`;
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
window.addEventListener('popstate', () => { search.value = new URL(location.href).searchParams.get('q') || ''; filter(false); });

function openHashProject() {
  const id = location.hash.slice(1);
  const project = projects.find(row => row.id === id);
  if (!project) return;
  if (project.hidden) return;
  project.open = true;
}
document.querySelectorAll('[data-open-project]').forEach(link => link.addEventListener('click', () => {
  const project = document.getElementById(link.dataset.openProject);
  if (project.hidden) { search.value = ''; filter(); }
  project.open = true;
}));
window.addEventListener('hashchange', openHashProject);
openHashProject();
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main.focus(); main.scrollIntoView();
});

const aircraftHost = document.querySelector('#horizon-aircraft');
const aircraftStatus = document.querySelector('#aircraft-status');
const aircraftControls = document.querySelector('.aircraft-controls');
const modeButtons = [...document.querySelectorAll('.mode-control button[data-mode]')];
let viewer;
function syncAircraft(state) {
  const ready = state.ready === 'true';
  aircraftControls.hidden = !ready;
  for (const button of aircraftControls.querySelectorAll('button')) button.disabled = !ready;
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  const message = !ready ? '' : state.renderer === 'ascii-fallback'
    ? '입체 가속을 사용할 수 없어 같은 모형을 문자로 표시합니다.'
    : state.renderer === 'webgl' ? '입체 모형으로 만든 787을 표시합니다.' : '문자로 만든 787을 표시합니다.';
  if (aircraftStatus.textContent !== message) aircraftStatus.textContent = message;
}
aircraftHost.addEventListener('skyviewerchange', event => syncAircraft(event.detail));
async function mountAircraft() {
  try {
    const { createSkyViewer } = await import('/sky-engine/viewer.mjs');
    aircraftHost.replaceChildren();
    viewer = createSkyViewer(aircraftHost, { mode: 'ascii', interactive: true });
    syncAircraft(viewer.getState());
    for (const button of modeButtons) button.addEventListener('click', () => {
      viewer.setMode(button.dataset.mode);
    });
    document.querySelector('#reset-aircraft').addEventListener('click', () => {
      viewer.reset(); aircraftStatus.textContent = '비행기를 처음 각도로 돌렸습니다.';
    });
  } catch {
    const message = document.createElement('p');
    message.className = 'aircraft-loading'; message.textContent = '지금은 비행기 모형을 표시할 수 없습니다.';
    aircraftHost.replaceChildren(message);
  }
}
mountAircraft();
window.addEventListener('pagehide', event => { if (!event.persisted) viewer?.destroy(); });
