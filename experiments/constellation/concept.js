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
for (const link of document.querySelectorAll('[data-activity-link]')) link.addEventListener('click', event => {
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
const intro = document.querySelector('.sky-intro');
const dotField = document.querySelector('.dot-field');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.min(1, Math.max(0, value));
let frame = 0;
let visible = true;
let destroyed = false;
let viewer;
function updateSky() {
  frame = 0;
  if (destroyed || document.hidden || !visible) return;
  const bounds = intro.getBoundingClientRect();
  const progress = clamp(-bounds.top / Math.max(1, intro.offsetHeight - innerHeight * .35));
  const eased = progress * progress * (3 - 2 * progress);
  if (motion.matches) {
    dotField.style.transform = '';
    viewer?.setOrientation({ azimuth: .42, elevation: .48, roll: 0, immediate: true });
    return;
  }
  dotField.style.transform = `translateY(${Math.round(progress * 34)}px)`;
  viewer?.setOrientation({ azimuth: .42 + eased * .26, elevation: .48 - eased * .16, roll: Math.sin(progress * Math.PI) * .08, immediate: true });
}
function scheduleSky() { if (!frame && !destroyed && !document.hidden && visible) frame = requestAnimationFrame(updateSky); }
const visibilityObserver = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  else scheduleSky();
}, { rootMargin: '150px' });
visibilityObserver.observe(intro);
window.addEventListener('scroll', scheduleSky, { passive: true });
window.addEventListener('resize', scheduleSky, { passive: true });
document.addEventListener('visibilitychange', scheduleSky);
motion.addEventListener('change', scheduleSky);
try {
  const { createSkyViewer } = await import('/sky-engine/viewer.mjs');
  host.replaceChildren();
  viewer = createSkyViewer(host, { mode: 'ascii', interactive: false });
  scheduleSky();
} catch {
  host.textContent = '';
  host.dataset.ready = 'false';
}
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  destroyed = true;
  visibilityObserver.disconnect();
  if (frame) cancelAnimationFrame(frame);
  viewer?.destroy();
});
window.addEventListener('pageshow', event => { if (event.persisted) scheduleSky(); });
