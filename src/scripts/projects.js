/** Native disclosures remain usable without JavaScript; enhancement adds shareable state. */
export function initProjects() {
  const list = document.querySelector('[data-project-list]');
  if (!list || list.dataset.enhanced === 'true') return;
  list.dataset.enhanced = 'true';
  const cards = [...list.querySelectorAll('[data-project-id]')];
  const cardFor = id => cards.find(card => card.dataset.projectId === id);

  function selectedId() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return ''; }
    return cardFor(id) ? id : '';
  }

  function focusSummary(summary) {
    summary.focus({ preventScroll: true });
    const box = summary.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) summary.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }

  function sync(id, moveFocus = false) {
    let hiddenFocus;
    for (const card of cards) {
      const open = card.dataset.projectId === id;
      const summary = card.querySelector('summary');
      if (moveFocus && !open && card.open && card.contains(document.activeElement) && document.activeElement !== summary) hiddenFocus = summary;
      card.open = open;
      summary.setAttribute('aria-expanded', String(open));
    }
    list.dataset.expanded = id;
    if (hiddenFocus) focusSummary(cardFor(id)?.querySelector('summary') || hiddenFocus);
  }

  function select(id) {
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.pushState(null, '', url);
    sync(id);
  }

  for (const card of cards) {
    const summary = card.querySelector('summary');
    card.addEventListener('toggle', () => summary.setAttribute('aria-expanded', String(card.open)));
    summary.addEventListener('click', event => {
      event.preventDefault();
      select(card.open ? '' : card.dataset.projectId);
      focusSummary(summary);
    });
    (card.closest('.project-card') || card).addEventListener('keydown', event => {
      if (event.key === 'Escape' && card.open) {
        event.preventDefault();
        select('');
        focusSummary(summary);
      }
    });
  }

  const restore = () => sync(selectedId(), true);
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  restore();
}
