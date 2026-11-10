export function normalizeBlogState({ category = 'all', query = '' } = {}, allowedCategories = new Set()) {
  return {
    category: allowedCategories.has(category) ? category : 'all',
    query: String(query).normalize('NFKC').trim(),
  };
}

export function filterPosts(posts, state = {}, allowedCategories = new Set(posts.map(post => post.category))) {
  const { category, query } = normalizeBlogState(state, allowedCategories);
  const words = query.toLocaleLowerCase('ko').split(/\s+/).filter(Boolean);
  return posts.filter(post => {
    if (category !== 'all' && post.category !== category) return false;
    const text = String(post.search ?? [post.title, post.summary].filter(Boolean).join(' '))
      .normalize('NFKC').toLocaleLowerCase('ko');
    return words.every(word => text.includes(word));
  });
}

export function readBlogState(search, allowedCategories) {
  const params = new URLSearchParams(search);
  return normalizeBlogState({ category: params.get('category') || 'all', query: params.get('q') || '' }, allowedCategories);
}

export function initBlog(root = document.querySelector('[data-blog]')) {
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';
  const form = root.querySelector('[data-blog-search]');
  const input = form.querySelector('input[name="q"]');
  const buttons = [...root.querySelectorAll('[data-blog-category]')];
  // The server-rendered controls are the public source of available categories.
  const allowedCategories = new Set(buttons.map(button => button.dataset.blogCategory));
  const records = [...root.querySelectorAll('[data-blog-post]')].map(element => ({
    element, category: element.dataset.category, search: element.dataset.search,
  }));
  const list = root.querySelector('[data-blog-posts]');
  const empty = root.querySelector('[data-blog-empty]');
  const noResults = root.querySelector('[data-blog-no-results]');
  const reset = root.querySelector('[data-blog-reset]');
  const announcement = root.querySelector('[data-blog-announcement]');
  let state = readBlogState(window.location.search, allowedCategories);
  let hasDraftHistoryEntry = false;

  function render({ syncInput = true } = {}) {
    if (syncInput) input.value = state.query;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.blogCategory === state.category));
    }
    const matches = new Set(filterPosts(records, state, allowedCategories));
    for (const record of records) record.element.hidden = !matches.has(record);
    const hasFilter = state.category !== 'all' || state.query !== '';
    list.hidden = matches.size === 0;
    empty.hidden = records.length > 0 || hasFilter;
    noResults.hidden = matches.size > 0 || (!hasFilter && records.length === 0);
    announcement.textContent = matches.size
      ? `${matches.size}개의 글이 있습니다.`
      : hasFilter ? '검색 결과가 없습니다.' : '아직 공개한 글이 없습니다.';
  }

  function updateURL(mode) {
    const url = new URL(window.location.href);
    if (state.category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', state.category);
    if (state.query) url.searchParams.set('q', state.query);
    else url.searchParams.delete('q');
    if (url.href === window.location.href) return false;
    window.history[mode]({}, '', url);
    return true;
  }

  function updateQuery({ commit = false } = {}) {
    state = normalizeBlogState({ ...state, query: input.value }, allowedCategories);
    const changed = updateURL(hasDraftHistoryEntry ? 'replaceState' : 'pushState');
    if (commit) hasDraftHistoryEntry = false;
    else if (changed) hasDraftHistoryEntry = true;
    render({ syncInput: commit });
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      state = normalizeBlogState({ category: button.dataset.blogCategory, query: input.value }, allowedCategories);
      updateURL('pushState');
      hasDraftHistoryEntry = false;
      render();
    });
  }

  input.addEventListener('input', event => {
    if (event.isComposing) return;
    updateQuery();
  });
  input.addEventListener('compositionend', () => {
    updateQuery();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    updateQuery({ commit: true });
  });
  reset.addEventListener('click', () => {
    state = normalizeBlogState();
    updateURL('pushState');
    hasDraftHistoryEntry = false;
    render();
    input.focus({ preventScroll: true });
  });
  window.addEventListener('popstate', () => {
    state = readBlogState(window.location.search, allowedCategories);
    hasDraftHistoryEntry = false;
    render();
  });
  render();
}
