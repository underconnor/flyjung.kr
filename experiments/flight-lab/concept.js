import { createSkyViewer } from '/sky-engine/viewer.mjs';

const defaults = Object.freeze({ drag: true, scroll: false, pointer: false, axis: 'both', type: 'orbit', sensitivity: 1, inertia: .5, reducedMotion: 'system' });
const combinations = { drag: { drag: true, scroll: false, pointer: false }, scroll: { drag: true, scroll: true, pointer: false }, pointer: { drag: true, scroll: false, pointer: true }, all: { drag: true, scroll: true, pointer: true } };
const form = document.querySelector('#lab-settings'), host = document.querySelector('#lab-aircraft');
const message = document.querySelector('#settings-message');
let viewer, applying = false, urlTimer;
function readURL() {
  const params = new URL(location.href).searchParams, inputs = { ...defaults };
  let invalid = false;
  for (const key of ['drag', 'scroll', 'pointer']) if (params.has(key)) {
    if (!['0', '1'].includes(params.get(key))) invalid = true;
    else inputs[key] = params.get(key) === '1';
  }
  for (const [key, name, choices] of [['axis', 'axis', ['both', 'horizontal', 'vertical']], ['type', 'type', ['orbit', 'bank']], ['reducedMotion', 'motion', ['system', 'reduce', 'full']]]) if (params.has(name)) {
    if (!choices.includes(params.get(name))) invalid = true;
    else inputs[key] = params.get(name);
  }
  for (const [key, min, max] of [['sensitivity', .25, 2.5], ['inertia', 0, 1]]) if (params.has(key)) {
    const value = params.get(key).trim() === '' ? NaN : Number(params.get(key));
    if (!Number.isFinite(value) || value < min || value > max) invalid = true;
    else inputs[key] = value;
  }
  const mode = params.get('mode') === 'solid' ? 'solid' : 'ascii';
  if (params.has('mode') && !['ascii', 'solid'].includes(params.get('mode'))) invalid = true;
  let view = params.get('view') || 'three', pose;
  if (!['three', 'side', 'top', 'custom'].includes(view)) { view = 'three'; invalid = true; }
  if (view === 'custom') {
    const number = key => params.has(key) && params.get(key).trim() !== '' ? Number(params.get(key)) : NaN;
    const azimuth = number('az'), elevation = number('el'), roll = params.has('roll') ? number('roll') : 0;
    if (!params.has('az') || !params.has('el') || !Number.isFinite(azimuth + elevation + roll) || elevation < -1.35 || elevation > 1.55 || Math.abs(roll) > .8) { view = 'three'; invalid = true; }
    else pose = { azimuth, elevation, roll, immediate: true };
  }
  return { inputs, mode, view, pose, invalid };
}
const initial = readURL();
viewer = createSkyViewer(host, { mode: initial.mode, interactive: true, inputOptions: initial.inputs });

function sync(state) {
  for (const key of ['drag', 'scroll', 'pointer']) form.elements.namedItem(key).checked = state.inputOptions[key];
  for (const key of ['axis', 'type', 'sensitivity', 'inertia', 'reducedMotion']) form.elements.namedItem(key).value = String(state.inputOptions[key]);
  document.querySelector('#sensitivity-value').value = `${state.inputOptions.sensitivity.toFixed(2)}×`;
  document.querySelector('#inertia-value').value = `${Math.round(state.inputOptions.inertia * 100)}%`;
  document.querySelector('#type-description').textContent = state.inputOptions.type === 'bank' ? '작은 방향 변화에 화면의 기울기를 더합니다.' : '기체의 주위를 돌며 여러 면을 봅니다.';
  for (const button of document.querySelectorAll('[data-combination]')) {
    const combination = combinations[button.dataset.combination];
    button.setAttribute('aria-pressed', String(Object.keys(combination).every(key => state.inputOptions[key] === combination[key])));
  }
  for (const button of document.querySelectorAll('button[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  for (const button of document.querySelectorAll('.view-buttons [data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
  const enabled = [['drag', '드래그'], ['scroll', '스크롤'], ['pointer', '마우스']].filter(([key]) => state.inputOptions[key]).map(([, label]) => label);
  document.querySelector('#input-summary').textContent = `${enabled.length ? enabled.join(' + ') : '연결된 입력 없음'} · ${state.inputOptions.type === 'bank' ? '비행 기울기' : '둘러보기'}`;
  const rendererText = state.ready === 'loading' ? '장면 준비 중' : state.ready === 'false' ? '그래픽을 불러오지 못했습니다' : state.renderer === 'webgl' ? '입체로 표시 중' : state.renderer === 'ascii-fallback' ? '문자 대체 표시 중' : 'ASCII로 표시 중';
  const rendererStatus = document.querySelector('#renderer-state');
  if (rendererStatus.textContent !== rendererText) rendererStatus.textContent = rendererText;
  document.querySelector('#motion-description').textContent = state.reducedMotion ? '현재 모션 줄이기 적용 중입니다. 전환과 관성 없이 바로 반응합니다.' : '짧은 시점 전환과 드래그 여운을 사용합니다. 멈추면 장면도 멈춥니다.';
  for (const [key, id] of [['azimuth', 'azimuth'], ['elevation', 'elevation'], ['roll', 'roll']]) document.querySelector(`#orientation-${id}`).value = `${Math.round(state[key] * 180 / Math.PI)}°`;
}
function settingsURL() {
  const state = viewer.getState(), url = new URL(location.href), params = new URLSearchParams();
  for (const key of ['drag', 'scroll', 'pointer']) if (state.inputOptions[key] !== defaults[key]) params.set(key, state.inputOptions[key] ? '1' : '0');
  for (const key of ['axis', 'type', 'sensitivity', 'inertia', 'reducedMotion']) if (state.inputOptions[key] !== defaults[key]) params.set(key === 'reducedMotion' ? 'motion' : key, String(state.inputOptions[key]));
  if (state.mode !== 'ascii') params.set('mode', state.mode);
  if (state.view !== 'three') params.set('view', state.view);
  if (state.view === 'custom') { params.set('az', state.azimuth.toFixed(4)); params.set('el', state.elevation.toFixed(4)); params.set('roll', state.roll.toFixed(4)); }
  url.search = params.toString(); return url;
}
function writeURL() { clearTimeout(urlTimer); history.replaceState(null, '', settingsURL()); }
function scheduleURL() { if (!applying) { clearTimeout(urlTimer); urlTimer = setTimeout(writeURL, 250); } }
function applyURL(state) {
  applying = true;
  viewer.setInputOptions(state.inputs); viewer.setMode(state.mode);
  if (state.pose) viewer.setOrientation(state.pose); else viewer.setView(state.view, { immediate: true });
  applying = false; sync(viewer.getState());
  if (state.invalid) message.textContent = '주소의 잘못된 설정은 기본값으로 바꿨습니다.';
}
host.addEventListener('skyviewerchange', event => { sync(event.detail); scheduleURL(); });
applyURL(initial);
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', event => {
  const input = event.target, key = input.name;
  if (!Object.hasOwn(defaults, key)) return;
  const value = input.type === 'checkbox' ? input.checked : input.type === 'range' ? Number(input.value) : input.value;
  viewer.setInputOptions({ [key]: value });
});
for (const button of document.querySelectorAll('[data-combination]')) button.addEventListener('click', () => viewer.setInputOptions(combinations[button.dataset.combination]));
document.querySelector('#disable-inputs').addEventListener('click', () => { viewer.setInputOptions({ drag: false, scroll: false, pointer: false }); message.textContent = '드래그·스크롤·마우스 연동을 껐습니다. 시점 버튼과 방향키는 사용할 수 있습니다.'; });
for (const button of document.querySelectorAll('button[data-mode]')) button.addEventListener('click', () => viewer.setMode(button.dataset.mode));
for (const button of document.querySelectorAll('.view-buttons [data-view]')) button.addEventListener('click', event => viewer.setView(button.dataset.view, { immediate: event.detail === 0 }));
document.querySelector('#reset-view').addEventListener('click', event => viewer.reset({ immediate: event.detail === 0 }));
form.addEventListener('reset', event => {
  event.preventDefault(); applying = true;
  viewer.setInputOptions(defaults); viewer.setMode('ascii'); viewer.reset({ immediate: true }); applying = false;
  sync(viewer.getState()); writeURL(); document.querySelector('#share-fallback').hidden = true;
  message.textContent = '모든 설정을 초기화했습니다. 드래그만 켜진 ASCII 사선 보기입니다.';
});
document.querySelector('#copy-settings').addEventListener('click', async () => {
  writeURL(); const value = settingsURL().href;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value); document.querySelector('#share-fallback').hidden = true; message.textContent = '현재 설정 링크를 복사했습니다.';
  } catch {
    const field = document.querySelector('#share-url'); document.querySelector('#share-fallback').hidden = false;
    field.value = value; field.focus(); field.select(); message.textContent = '주소를 표시했습니다. 선택된 주소를 복사해 주세요.';
  }
});
window.addEventListener('popstate', () => { clearTimeout(urlTimer); applyURL(readURL()); });
window.addEventListener('pagehide', event => { clearTimeout(urlTimer); if (!event.persisted) viewer.destroy(); });
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); document.querySelector('#main').focus(); document.querySelector('#main').scrollIntoView(); });
