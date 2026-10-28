const searchForm = document.querySelector('.project-search');
const search = document.querySelector('#project-search');
const rows = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('#project-count');
const empty = document.querySelector('#project-empty');
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim();

function filterProjects(updateURL = true) {
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

search.value = new URL(location.href).searchParams.get('q') || '';
filterProjects(false);
searchForm.hidden = false;
search.addEventListener('input', () => filterProjects());
searchForm.addEventListener('submit', event => { event.preventDefault(); filterProjects(); });
searchForm.addEventListener('reset', event => {
  event.preventDefault();
  search.value = '';
  filterProjects();
  search.focus();
});
search.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  search.value = '';
  filterProjects();
});

function revealFragment() {
  const row = rows.find(entry => `#${entry.id}` === location.hash);
  if (!row) return;
  if (row.hidden) {
    search.value = '';
    filterProjects();
  }
  row.open = true;
}
for (const link of document.querySelectorAll('[data-open-project]')) link.addEventListener('click', event => {
  const row = document.getElementById(link.dataset.openProject);
  if (!row) return;
  event.preventDefault();
  if (row.hidden) {
    search.value = '';
    filterProjects();
  }
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
  filterProjects(false);
  revealFragment();
});
revealFragment();
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  document.querySelector('#main').focus();
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const journey = document.querySelector('.night-journey');
const constellationField = document.querySelector('.constellation-field');
const clusters = [...constellationField.querySelectorAll('.cluster[data-cluster]')];
const track = document.querySelector('.aircraft-track');
const host = document.querySelector('#cruise-aircraft');
const depthLayers = [...journey.querySelectorAll('.sky-depth')];
const responsiveStars = [...constellationField.querySelectorAll('.star-core, .waypoint')];
const constellationShapes = {
  project: {
    points: {
      shin: '.node-shin .star-core',
      p0: '.waypoint-0', p1: '.waypoint-1', p2: '.waypoint-2', p3: '.waypoint-3',
      momu: '.node-momu .star-core',
    },
    paths: [['shin', 'p0', 'p1'], ['p1', 'p2', 'momu', 'p3', 'p1']],
  },
  activity: {
    points: {
      pron: '.node-pron .star-core',
      p0: '.waypoint-0', p1: '.waypoint-1', p2: '.waypoint-2',
      ai: '.node-ai .star-core', it: '.node-it .star-core',
    },
    paths: [['pron', 'p0', 'p1', 'ai', 'p2', 'it'], ['p1', 'p2']],
  },
};

function alignClusterLines() {
  for (const cluster of clusters) {
    const bounds = cluster.getBoundingClientRect();
    if (!bounds.width || !bounds.height) continue;
    const shape = constellationShapes[cluster.dataset.cluster];
    if (!shape) continue;
    const points = Object.fromEntries(Object.entries(shape.points).map(([name, selector]) => {
      const dot = cluster.querySelector(selector);
      if (!dot) return [name, null];
      const point = dot.getBoundingClientRect();
      return [name, [
        ((point.left + point.width / 2 - bounds.left) / bounds.width * 100).toFixed(3),
        ((point.top + point.height / 2 - bounds.top) / bounds.height * 100).toFixed(3),
      ]];
    }));
    const pathData = shape.paths
      .filter(path => path.every(name => points[name]))
      .map(path => path.map((name, index) => `${index ? 'L' : 'M'} ${points[name][0]} ${points[name][1]}`).join(' '))
      .join(' ');
    cluster.querySelector('.cluster-lines path')?.setAttribute('d', pathData);
  }
}
const lineResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(alignClusterLines) : null;
for (const cluster of clusters) lineResizeObserver?.observe(cluster);
alignClusterLines();
document.fonts?.ready.then(alignClusterLines);
window.addEventListener('resize', alignClusterLines, { passive: true });

const recordStars = [...constellationField.querySelectorAll('.star-node')];
function highlightRecord(active) {
  const selected = active?.closest('.cluster') || null;
  for (const cluster of clusters) cluster.classList.toggle('is-active', cluster === selected);
  for (const record of recordStars) {
    record.classList.toggle('is-dimmed', Boolean(selected) && record.closest('.cluster') !== selected);
  }
}
function restoreFocusedRecord() {
  highlightRecord(recordStars.includes(document.activeElement) ? document.activeElement : null);
}
for (const record of recordStars) {
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
    const distance = [0.35, 0.8, 1.5][index] ?? 1.5;
    layer.style.transform = `translate(${(x * distance).toFixed(2)}px, ${(y * distance).toFixed(2)}px)`;
  }
  for (const star of responsiveStars) {
    const bounds = star.getBoundingClientRect();
    const distance = Math.hypot(bounds.left + bounds.width / 2 - pointerX, bounds.top + bounds.height / 2 - pointerY);
    const influence = Math.max(0, 1 - distance / 180) ** 2;
    if (influence < .01) {
      star.style.removeProperty('--star-glow');
      star.style.removeProperty('--star-alpha');
      continue;
    }
    star.style.setProperty('--star-glow', `${Math.round(9 + influence * 9)}px`);
    star.style.setProperty('--star-alpha', (0.4 + influence * .24).toFixed(2));
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

const meteorLinks = [...document.querySelectorAll('.meteor')];
const meteorObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    entry.target.classList.add('is-fallen');
    meteorObserver.unobserve(entry.target);
  }
}, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
document.body.classList.add('meteors-ready');
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
  const fieldBottom = constellationField.getBoundingClientRect().bottom;
  // Clear the 787 before the first meteor crosses its sticky screen position.
  const fade = clamp((fieldBottom - innerHeight * .62) / (innerHeight * .18));
  track.style.opacity = String(fade);
  if (reducedMotion.matches) {
    track.style.removeProperty('--plane-x');
    track.style.removeProperty('--plane-y');
    viewer.setOrientation({ azimuth: .52, elevation: .62, roll: 0, immediate: true });
    return;
  }
  const travel = Math.max(360, journey.offsetHeight - innerHeight * .95);
  const progress = clamp(-journey.getBoundingClientRect().top / travel);
  const mobile = innerWidth <= 600;
  track.style.setProperty('--plane-x', `${Math.round(progress * (mobile ? -27 : -42))}px`);
  track.style.setProperty('--plane-y', `${Math.round(progress * (mobile ? 64 : 92))}px`);
  viewer.setOrientation({
    azimuth: .52 + progress * .06,
    elevation: .62 - progress * .01,
    roll: Math.sin(progress * Math.PI) * .018,
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
  meteorObserver.disconnect();
  lineResizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  resetPointerSky();
  viewer?.destroy();
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  alignClusterLines();
  schedule();
});
