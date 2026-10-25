const searchForm = document.querySelector('.project-search');
const search = document.querySelector('#project-search');
const projects = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('#project-count');
const empty = document.querySelector('#project-empty');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim();
function filter(updateURL = true) {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const project of projects) {
    project.hidden = !terms.every(term => normalize(project.dataset.search).includes(term));
    if (!project.hidden) visible++;
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
window.addEventListener('popstate', () => { search.value = new URL(location.href).searchParams.get('q') || ''; filter(false); revealFragment(); });

function revealFragment() {
  const project = projects.find(row => row.id === location.hash.slice(1));
  if (project && !project.hidden) project.open = true;
}
for (const link of document.querySelectorAll('[data-open-project]')) link.addEventListener('click', event => {
  const project = document.getElementById(link.dataset.openProject);
  if (!project) return;
  event.preventDefault();
  if (project.hidden) { search.value = ''; filter(); }
  project.open = true;
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  project.querySelector('summary').focus({ preventScroll: true });
  project.scrollIntoView({ behavior: event.detail && !reducedMotion() ? 'smooth' : 'instant', block: 'start' });
});
for (const link of document.querySelectorAll('.activity-star')) link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: event.detail && !reducedMotion() ? 'smooth' : 'instant', block: 'center' });
});
window.addEventListener('hashchange', revealFragment);
revealFragment();
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); const main = document.querySelector('#main'); main.focus(); main.scrollIntoView({ behavior: 'instant' }); });

const host = document.querySelector('#atmosphere-aircraft');
const controls = document.querySelector('.aircraft-controls');
const status = document.querySelector('#aircraft-status');
const modes = [...controls.querySelectorAll('button[data-mode]')];
let viewer;
function syncViewer(state) {
  const ready = state.ready === 'true';
  controls.hidden = !ready;
  for (const button of controls.querySelectorAll('button')) button.disabled = !ready;
  for (const button of modes) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  const text = state.ready === 'false' ? '비행기 모형을 불러오지 못했습니다.' : state.renderer === 'ascii-fallback' ? '입체 가속을 사용할 수 없어 문자로 표시합니다.' : '';
  if (status.textContent !== text) status.textContent = text;
}
host.addEventListener('skyviewerchange', event => syncViewer(event.detail));
try {
  const { createSkyViewer } = await import('/sky-engine/viewer.mjs');
  host.replaceChildren();
  viewer = createSkyViewer(host, { mode: 'ascii', interactive: true });
  syncViewer(viewer.getState());
  for (const button of modes) button.addEventListener('click', () => viewer.setMode(button.dataset.mode));
  document.querySelector('#aircraft-reset').addEventListener('click', () => viewer.reset());
} catch {
  host.textContent = '지금은 비행기 모형을 표시할 수 없습니다.';
  host.dataset.ready = 'false';
}
window.addEventListener('pagehide', event => { if (!event.persisted) viewer?.destroy(); });
