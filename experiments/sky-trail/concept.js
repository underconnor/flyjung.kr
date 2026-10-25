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
  const row = rows.find(entry => `#${entry.id}` === location.hash);
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
for (const link of document.querySelectorAll('[data-activity-link]')) link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: 'instant', block: 'center' });
});
window.addEventListener('hashchange', revealFragment);
window.addEventListener('popstate', () => {
  search.value = new URL(location.href).searchParams.get('q') || '';
  filter(false);
  revealFragment();
});
revealFragment();
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const flight = document.querySelector('.flight-passage');
const radarHeading = document.querySelector('.radar-heading');
const radarField = document.querySelector('.radar-field');
const host = document.querySelector('#trail-aircraft');
const track = document.querySelector('.aircraft-track');
function alignConstellationLines() {
  const bounds = radarField.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  for (const type of ['project', 'activity']) {
    const path = radarField.querySelector(`.${type}-line`);
    const points = [...radarField.querySelectorAll(`.${type}-record-0 .chart-point, .${type}-record-1 .chart-point, .${type}-record-2 .chart-point`)].map(dot => {
      const point = dot.getBoundingClientRect();
      return [
        ((point.left + point.width / 2 - bounds.left) / bounds.width * 100).toFixed(3),
        ((point.top + point.height / 2 - bounds.top) / bounds.height * 100).toFixed(3),
      ];
    });
    path?.setAttribute('d', points.map(([x,y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' '));
  }
}
const lineResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(alignConstellationLines) : null;
lineResizeObserver?.observe(radarField);
alignConstellationLines();
window.addEventListener('resize', alignConstellationLines, { passive: true });
let viewer;
let frame = 0;
let visible = true;
let destroyed = false;
const clamp = value => Math.max(0, Math.min(1, value));
function applyScroll() {
  frame = 0;
  if (destroyed || document.hidden || !visible || !viewer) return;
  if (reducedMotion.matches) {
    track.style.opacity = '1';
    viewer.setOrientation({ azimuth: .52, elevation: .62, roll: 0, immediate: true });
    return;
  }
  const flightTop = flight.getBoundingClientRect().top;
  const progress = clamp((100 - flightTop) / Math.max(200, innerHeight * .32));
  const radarTop = radarHeading.getBoundingClientRect().top;
  // Finish the aircraft fade before the first plotted record can enter view.
  const fade = clamp((radarTop - innerHeight) / 180);
  track.style.opacity = String(fade);
  viewer.setOrientation({
    azimuth: .52 + progress * .67,
    elevation: .62 - progress * .32,
    roll: Math.sin(progress * Math.PI) * .18,
    immediate: true,
  });
}
function schedule() {
  if (!frame && !destroyed && !document.hidden && visible) frame = requestAnimationFrame(applyScroll);
}
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
reducedMotion.addEventListener('change', schedule);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
  else schedule();
});
const flightObserver = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  else schedule();
}, { rootMargin: '180px' });
flightObserver.observe(flight);

if (!reducedMotion.matches) document.body.classList.add('line-reveal');
const chartObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-visible');
    chartObserver.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -18% 0px' });
chartObserver.observe(radarField);
reducedMotion.addEventListener('change', () => {
  document.body.classList.toggle('line-reveal', !reducedMotion.matches);
});

try {
  const { createSkyViewer } = await import('/sky-engine/viewer.mjs');
  host.replaceChildren();
  viewer = createSkyViewer(host, { mode: 'ascii', interactive: false });
  schedule();
} catch {
  host.textContent = '787';
}
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  destroyed = true;
  flightObserver.disconnect();
  chartObserver.disconnect();
  lineResizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  viewer?.destroy();
});
window.addEventListener('pageshow', event => { if (event.persisted) schedule(); });
