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
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const flight = document.querySelector('.flight-passage');
const journey = document.querySelector('.sky-journey');
const radar = document.querySelector('.radar-stage');
const radarField = document.querySelector('.radar-field');
const host = document.querySelector('#trail-aircraft');
const track = document.querySelector('.aircraft-track');
const depthLayers = [...journey.querySelectorAll('.sky-depth')];
const responsiveStars = [...radarField.querySelectorAll('.chart-point, .chart-feature, .chart-decor')];
function alignConstellationLines() {
  const bounds = radarField.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const center = dot => {
    const point = dot.getBoundingClientRect();
    return [
      ((point.left + point.width / 2 - bounds.left) / bounds.width * 100).toFixed(3),
      ((point.top + point.height / 2 - bounds.top) / bounds.height * 100).toFixed(3),
    ];
  };
  const activityPoints = [...radarField.querySelectorAll('.activity-record-0 .chart-point, .activity-record-1 .chart-point, .activity-record-2 .chart-point')].map(center);
  radarField.querySelector('.activity-line')?.setAttribute('d', activityPoints.map(([x,y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' '));
  const decorPoints = [...radarField.querySelectorAll('.chart-decor')].map(center);
  const bowl = decorPoints[3];
  radarField.querySelector('.decor-line')?.setAttribute('d', `${decorPoints.map(([x,y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ')} L ${bowl[0]} ${bowl[1]}`);
  for (const line of radarField.querySelectorAll('.feature-line')) {
    const [recordClass, featureClass] = line.dataset.connect.split(':');
    const record = radarField.querySelector(`.${recordClass} .chart-point`);
    const feature = radarField.querySelector(`.${featureClass}`);
    if (!record || !feature) continue;
    const [x1,y1] = center(record);
    const [x2,y2] = center(feature);
    line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
  }
}
const lineResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(alignConstellationLines) : null;
lineResizeObserver?.observe(radarField);
alignConstellationLines();
document.fonts?.ready.then(alignConstellationLines);
window.addEventListener('resize', alignConstellationLines, { passive: true });
const chartRecords = [...radarField.querySelectorAll('.chart-record')];
function highlightRecord(active) {
  const projectClass = active?.classList.contains('project-record-0') ? 'project-record-0' : active?.classList.contains('project-record-1') ? 'project-record-1' : null;
  const activityActive = Boolean(active?.classList.contains('activity-record-0') || active?.classList.contains('activity-record-1') || active?.classList.contains('activity-record-2'));
  radarField.classList.toggle('has-highlight', Boolean(active));
  for (const record of chartRecords) {
    const related = record === active || activityActive && record.classList.contains('activity-record-0') || activityActive && record.classList.contains('activity-record-1') || activityActive && record.classList.contains('activity-record-2');
    record.classList.toggle('is-related', related);
    record.classList.toggle('is-dimmed', Boolean(active) && !related);
  }
  radarField.querySelector('.activity-line')?.classList.toggle('is-related', activityActive);
  for (const line of radarField.querySelectorAll('.feature-line')) {
    const related = Boolean(projectClass && line.dataset.connect.startsWith(`${projectClass}:`));
    line.classList.toggle('is-related', related);
    radarField.querySelector(`.${line.dataset.connect.split(':')[1]}`)?.classList.toggle('is-related', related);
  }
}
function restoreFocusedRecord() {
  highlightRecord(chartRecords.includes(document.activeElement) ? document.activeElement : null);
}
for (const record of chartRecords) {
  record.addEventListener('mouseenter', () => highlightRecord(record));
  record.addEventListener('mouseleave', restoreFocusedRecord);
  record.addEventListener('focus', () => highlightRecord(record));
  record.addEventListener('blur', () => highlightRecord(null));
}
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;
function resetPointerSky() {
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  for (const layer of depthLayers) layer.style.removeProperty('transform');
  for (const star of responsiveStars) {
    star.style.removeProperty('--star-glow');
    star.style.removeProperty('--star-alpha');
  }
}
function paintPointerSky() {
  pointerFrame = 0;
  if (reducedMotion.matches || !finePointer.matches) return resetPointerSky();
  const x = Math.max(-1, Math.min(1, (pointerX - innerWidth / 2) / (innerWidth / 2)));
  const y = Math.max(-1, Math.min(1, (pointerY - innerHeight / 2) / (innerHeight / 2)));
  for (const [index, layer] of depthLayers.entries()) {
    const distance = [2, 5, 9][index];
    layer.style.transform = `translate(${(x * distance).toFixed(2)}px, ${(y * distance).toFixed(2)}px)`;
  }
  for (const star of responsiveStars) {
    const bounds = star.getBoundingClientRect();
    const distance = Math.hypot(bounds.left + bounds.width / 2 - pointerX, bounds.top + bounds.height / 2 - pointerY);
    const influence = Math.max(0, 1 - distance / 260) ** 2;
    if (influence < .01) {
      star.style.removeProperty('--star-glow');
      star.style.removeProperty('--star-alpha');
      continue;
    }
    star.style.setProperty('--star-glow', `${Math.round(13 + influence * 15)}px`);
    star.style.setProperty('--star-alpha', (0.56 + influence * .34).toFixed(2));
  }
}
journey.addEventListener('pointermove', event => {
  if (!finePointer.matches || reducedMotion.matches) return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointerSky);
}, { passive: true });
journey.addEventListener('pointerleave', resetPointerSky);
reducedMotion.addEventListener('change', resetPointerSky);
finePointer.addEventListener('change', resetPointerSky);

const meteorStage = document.querySelector('.meteor-stage');
const meteorLinks = [...meteorStage.querySelectorAll('.meteor')];
const meteorObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-fallen');
    meteorObserver.unobserve(entry.target);
  }
}, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
meteorStage.classList.add('meteors-ready');
for (const link of meteorLinks) {
  if (reducedMotion.matches) link.classList.add('is-fallen', 'meteor-no-motion');
  else meteorObserver.observe(link);
}
reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  for (const link of meteorLinks) {
    link.classList.add('is-fallen', 'meteor-no-motion');
    meteorObserver.unobserve(link);
  }
});
let viewer;
let frame = 0;
let visible = true;
let destroyed = false;
const clamp = value => Math.max(0, Math.min(1, value));
function applyScroll() {
  frame = 0;
  if (destroyed || document.hidden || !visible || !viewer) return;
  const radarBottom = radar.getBoundingClientRect().bottom;
  if (reducedMotion.matches) {
    track.style.removeProperty('--plane-shift');
    track.style.opacity = radarBottom > innerHeight * .4 ? '1' : '0';
    viewer.setOrientation({ azimuth: .42, elevation: .48, roll: 0, immediate: true });
    return;
  }
  const darkTravel = flight.offsetHeight + radar.offsetHeight - innerHeight * .45;
  const progress = clamp((100 - journey.getBoundingClientRect().top) / Math.max(300, darkTravel));
  // Keep the 787 beside every constellation; let it dissolve in the meteor sky.
  const fade = clamp((radarBottom - innerHeight * .52) / (innerHeight * .43));
  const descent = innerWidth <= 600 ? Math.min(185, innerHeight * .25) : innerWidth <= 800 ? Math.min(150, innerHeight * .17) : Math.min(210, innerHeight * .24);
  track.style.setProperty('--plane-shift', `${Math.round(progress * descent)}px`);
  track.style.opacity = String(fade);
  viewer.setOrientation({
    azimuth: .42 + progress * .76,
    elevation: .48 - progress * .2,
    roll: Math.sin(progress * Math.PI) * .16,
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
const journeyObserver = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  else schedule();
}, { rootMargin: '180px' });
journeyObserver.observe(journey);

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
  journeyObserver.disconnect();
  chartObserver.disconnect();
  meteorObserver.disconnect();
  lineResizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  resetPointerSky();
  viewer?.destroy();
});
window.addEventListener('pageshow', event => { if (event.persisted) schedule(); });
