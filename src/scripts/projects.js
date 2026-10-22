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

  function sync(id) {
    for (const card of cards) {
      const open = card.dataset.projectId === id;
      card.open = open;
      card.querySelector('summary').setAttribute('aria-expanded', String(open));
    }
    list.dataset.expanded = id;
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
      summary.focus({ preventScroll: true });
      // The selected row can move when its sibling changes from grid to a compact row.
      // Keep the focused control visible without animating the surrounding page.
      const box = summary.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) summary.scrollIntoView({ block: 'nearest' });
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Escape' && card.open) {
        event.preventDefault();
        select('');
        summary.focus({ preventScroll: true });
      }
    });
  }

  const restore = () => sync(selectedId());
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  restore();
}
