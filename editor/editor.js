const byId = id => document.getElementById(id);
const form = byId('post-form');
const fields = ['title', 'slug', 'category', 'date', 'summary', 'body'];
let current = null;
let saved = '';
let busy = false;
let pendingConfirm;

function data() { return Object.fromEntries(fields.map(key => [key, byId(`post-${key}`).value])); }
function isDirty() { return current && JSON.stringify(data()) !== saved; }
function announce(message, error = false) {
  byId('message').textContent = message;
  byId('message').dataset.error = String(error);
  byId('message').setAttribute('role', error ? 'alert' : 'status');
}
function updateState() {
  if (!current) return;
  byId('save-state').textContent = isDirty() ? '저장되지 않은 변경 사항이 있습니다.' : '이 컴퓨터에 저장됨';
  byId('word-count').textContent = `${byId('post-body').value.length.toLocaleString('ko-KR')}자`;
}
async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '요청을 완료하지 못했습니다.');
  return result;
}
async function run(action) {
  if (busy) return;
  busy = true;
  form.setAttribute('aria-busy', 'true');
  announce('처리 중입니다.');
  const controls = [...document.querySelectorAll('button, input, textarea, select')];
  const disabled = controls.map(control => control.disabled);
  controls.forEach(control => { control.disabled = true; });
  try { await action(); } catch (error) { announce(error.message || '작업을 완료하지 못했습니다.', true); }
  finally { controls.forEach((control, index) => { control.disabled = disabled[index]; }); busy = false; form.setAttribute('aria-busy', 'false'); updateState(); }
}
function confirmAction(title, copy, detail, label = '확인') {
  byId('confirm-title').textContent = title;
  byId('confirm-copy').textContent = copy;
  byId('confirm-detail').textContent = detail;
  byId('confirm-detail').hidden = !detail;
  byId('accept-confirm').textContent = label;
  byId('confirm-dialog').showModal();
  byId('cancel-confirm').focus();
  return new Promise(resolve => { pendingConfirm = resolve; });
}
function finishConfirm(accepted) {
  byId('confirm-dialog').close();
  pendingConfirm?.(accepted);
  pendingConfirm = null;
}
byId('accept-confirm').addEventListener('click', () => finishConfirm(true));
byId('cancel-confirm').addEventListener('click', () => finishConfirm(false));
byId('confirm-dialog').addEventListener('cancel', () => { pendingConfirm?.(false); pendingConfirm = null; });
async function canLeave() {
  return !isDirty() || confirmAction('저장하지 않은 내용을 나갈까요?', '현재 입력한 변경 사항은 사라집니다. 남겨 두려면 취소한 뒤 초안 저장을 눌러 주세요.', '', '저장하지 않고 이동');
}
function showDraft(draft) {
  current = draft;
  for (const key of fields) byId(`post-${key}`).value = draft[key] || '';
  byId('post-slug').readOnly = Boolean(draft.sourceSlug);
  byId('withdraw-post').hidden = !draft.sourceSlug;
  byId('draft-context').textContent = draft.sourceSlug ? '등록된 글의 편집 초안' : '이 컴퓨터의 초안';
  saved = JSON.stringify(data());
  byId('welcome').hidden = true;
  form.hidden = false;
  updateState();
  for (const button of document.querySelectorAll('[data-draft-id]')) button.setAttribute('aria-current', String(button.dataset.draftId === draft.id));
}
function listButton(item, draft) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'item-button';
  const title = document.createElement('strong');
  title.textContent = item.title || '제목 없는 초안';
  const caption = document.createElement('span');
  caption.textContent = draft ? (item.sourceSlug ? '등록된 글의 편집 초안' : '초안') : `배포 대상 · ${item.date}`;
  button.append(title, caption);
  if (draft) { button.dataset.draftId = item.id; button.setAttribute('aria-current', String(current?.id === item.id)); }
  button.addEventListener('click', async () => {
    if (!await canLeave()) return;
    await run(async () => {
      const opened = draft ? await request(`/api/drafts/${item.id}`) : await request('/api/drafts', { method: 'POST', body: JSON.stringify({ sourceSlug: item.slug }) });
      showDraft(opened);
      await refresh();
      announce(draft ? '초안을 열었습니다.' : '편집 초안을 만들었습니다. 다시 등록하기 전까지 기존 배포 대상은 바뀌지 않습니다.');
    });
    byId('post-title').focus();
  });
  return button;
}
async function refresh() {
  const result = await request('/api/items');
  if (!byId('post-category').options.length) {
    for (const category of result.categories) byId('post-category').add(new Option(category.label, category.id));
  }
  for (const [kind, items, empty] of [['draft', result.drafts, '아직 초안이 없습니다.'], ['post', result.posts, '등록한 글이 없습니다.']]) {
    const list = byId(`${kind}-list`);
    list.replaceChildren(...items.map(item => listButton(item, kind === 'draft')));
    byId(`${kind}-count`).textContent = items.length;
    if (!items.length) { const text = document.createElement('p'); text.className = 'list-empty'; text.textContent = empty; list.append(text); }
  }
}
async function createDraft() {
  if (!await canLeave()) return;
  await run(async () => {
    showDraft(await request('/api/drafts', { method: 'POST', body: '{}' }));
    await refresh();
    announce('새 초안을 만들었습니다. 작성 중에는 초안 저장을 눌러 주세요.');
  });
  byId('post-title').focus();
}
async function saveDraft() {
  const result = await request(`/api/drafts/${current.id}`, { method: 'PUT', body: JSON.stringify({ ...data(), revision: current.revision }) });
  showDraft(result);
  await refresh();
  return result;
}
byId('new-post').addEventListener('click', createDraft);
byId('welcome-new').addEventListener('click', createDraft);
byId('refresh-list').addEventListener('click', () => run(async () => { await refresh(); announce('글 목록을 새로고침했습니다.'); }));
form.addEventListener('input', updateState);
form.addEventListener('submit', event => {
  event.preventDefault();
  run(async () => { await saveDraft(); announce('초안을 이 컴퓨터에 저장했습니다.'); });
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's' && current) { event.preventDefault(); if (!busy) form.requestSubmit(); }
});
window.addEventListener('beforeunload', event => { if (isDirty()) { event.preventDefault(); event.returnValue = ''; } });
byId('preview-post').addEventListener('click', () => run(async () => {
  announce('미리보기를 만들고 있습니다.');
  const result = await request(`/api/drafts/${current.id}/preview`, { method: 'POST', body: JSON.stringify(data()) });
  byId('preview-frame').srcdoc = result.html;
  byId('preview-dialog').showModal();
  announce('현재 입력으로 미리보기를 열었습니다. 초안 저장이나 배포 등록은 하지 않았습니다.');
}));
byId('close-preview').addEventListener('click', () => byId('preview-dialog').close());
byId('publish-post').addEventListener('click', async () => {
  if (busy || !current) return;
  if (!await confirmAction('배포할 글로 등록할까요?', '현재 입력을 저장하고, 다음 사이트 빌드와 Git 커밋에 포함할 글로 등록합니다. 인터넷 사이트에는 아직 반영되지 않습니다.\n개인 정보나 공개하지 않을 내용이 없는지 확인해 주세요.', `${data().title || '(제목 없음)'}\n/blog/${data().slug || '(글 주소)'}/`, '저장 후 배포 대상으로 등록')) return;
  await run(async () => {
    await saveDraft();
    const result = await request(`/api/drafts/${current.id}/publish`, { method: 'POST', body: JSON.stringify({ revision: current.revision, confirm: true }) });
    showDraft(result.draft);
    await refresh();
    announce('배포 대상으로 등록했습니다. 사이트 빌드·검사·배포 후 인터넷에 반영됩니다.');
  });
});
byId('withdraw-post').addEventListener('click', async () => {
  if (busy || !current?.sourceSlug) return;
  if (!await confirmAction('배포 대상에서 제외할까요?', '등록된 내용을 이 컴퓨터의 초안으로 보관하고 다음 빌드에서 제외합니다. 이미 인터넷에 올라간 글은 다음 배포 전까지 유지됩니다.', `/blog/${current.sourceSlug}/`, '초안으로 보관하고 제외')) return;
  await run(async () => {
    if (isDirty()) await saveDraft();
    const result = await request(`/api/posts/${current.sourceSlug}/withdraw`, { method: 'POST', body: JSON.stringify({ confirm: true, sourceFingerprint: current.sourceFingerprint }) });
    showDraft(result.draft);
    await refresh();
    announce('등록된 내용을 초안으로 보관하고 배포 대상에서 제외했습니다. 인터넷 반영에는 다음 배포가 필요합니다.');
  });
});
run(async () => { await refresh(); announce('초안은 이 컴퓨터에만 저장됩니다.'); });
