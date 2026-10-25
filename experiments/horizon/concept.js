const skyMap = document.querySelector('.sky-map');
const graphNodes = [...skyMap.querySelectorAll('[data-graph-node]')];
const graphEdges = [...skyMap.querySelectorAll('[data-graph-edge]')];
const graphCaption = document.querySelector('#graph-caption');
const defaultGraphCaption = graphCaption.textContent;
function placeGraphEdges() {
  const bounds = skyMap.getBoundingClientRect();
  const center = element => {
    const point = element.getBoundingClientRect();
    return { x:(point.x + point.width / 2 - bounds.x) / bounds.width * 100, y:(point.y + point.height / 2 - bounds.y) / bounds.height * 100 };
  };
  const hub = center(skyMap.querySelector('.graph-hub .node-star'));
  for (const edge of graphEdges) {
    const node = graphNodes.find(item => item.dataset.graphNode === edge.dataset.graphEdge);
    const point = center(node.querySelector('.node-star'));
    for (const [name,value] of Object.entries({x1:hub.x,y1:hub.y,x2:point.x,y2:point.y})) edge.setAttribute(name,String(value));
  }
}
const graphObserver = new ResizeObserver(placeGraphEdges);
graphObserver.observe(skyMap);
document.fonts.ready.then(placeGraphEdges);
let hoverNode = null;
function highlightGraph() {
  const node = graphNodes.find(item => item === document.activeElement) || hoverNode;
  const key = node?.dataset.graphNode;
  if (key) skyMap.dataset.active = key;
  else delete skyMap.dataset.active;
  for (const item of graphNodes) item.classList.toggle('is-active',item === node);
  for (const edge of graphEdges) edge.classList.toggle('is-active',edge.dataset.graphEdge === key);
  graphCaption.textContent = node?.dataset.description || defaultGraphCaption;
}
for (const node of graphNodes) {
  node.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hoverNode = node; highlightGraph(); } });
  node.addEventListener('pointerleave', () => { hoverNode = null; highlightGraph(); });
  node.addEventListener('focus', highlightGraph);
  node.addEventListener('blur', () => { queueMicrotask(highlightGraph); });
}

const starCanvas = document.querySelector('#ascii-stars');
const starContext = starCanvas.getContext('2d');
const hero = document.querySelector('.hero');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let starFrame = 0, starWidth = 0, starHeight = 0, painted = 0;
const pointer = { x:0, y:0 };
let seed = 6073;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const stars = Array.from({length:105}, () => ({x:random(),y:random(),depth:.35+random()*.65,size:8+random()*5,opacity:.22+random()*.4,letter:random()<.55?'.':random()<.6?'+':'*'}));
function drawStars() {
  starFrame = 0;
  if (!starContext || !starWidth || !starHeight || document.hidden) return;
  const ratio = Math.min(devicePixelRatio || 1,2);
  starContext.setTransform(ratio,0,0,ratio,0,0);
  starContext.clearRect(0,0,starWidth,starHeight);
  starContext.textAlign = 'center'; starContext.textBaseline = 'middle';
  for (const star of stars) {
    const x = star.x * starWidth + pointer.x * star.depth;
    const y = star.y * starHeight + pointer.y * star.depth;
    const shade = starWidth > 600 ? (x < starWidth * .48 ? .38 : 1) : (y < starHeight * .48 ? .4 : 1);
    starContext.font = `${star.size}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    starContext.fillStyle = `rgba(174,194,247,${star.opacity * shade})`;
    starContext.fillText(star.letter,x,y);
  }
  starCanvas.dataset.renderCount = String(++painted);
}
function requestStars() { if (!starFrame && !document.hidden) starFrame = requestAnimationFrame(drawStars); }
const starObserver = starContext ? new ResizeObserver(() => {
  const bounds = hero.getBoundingClientRect();
  starWidth = bounds.width; starHeight = bounds.height;
  const ratio = Math.min(devicePixelRatio || 1,2);
  starCanvas.width = Math.round(starWidth * ratio); starCanvas.height = Math.round(starHeight * ratio);
  requestStars();
}) : null;
starObserver?.observe(hero);
hero.addEventListener('pointermove', event => {
  if (!starContext || reducedMotion.matches || event.pointerType === 'touch') return;
  const bounds = hero.getBoundingClientRect();
  pointer.x = (event.clientX - bounds.x - bounds.width / 2) / bounds.width * 8;
  pointer.y = (event.clientY - bounds.y - bounds.height / 2) / bounds.height * 8;
  requestStars();
});
hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; requestStars(); });
reducedMotion.addEventListener('change', () => { pointer.x = pointer.y = 0; requestStars(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestStars(); });

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
window.addEventListener('pagehide', event => {
  if (!event.persisted) { viewer?.destroy(); graphObserver.disconnect(); starObserver?.disconnect(); cancelAnimationFrame(starFrame); }
});
