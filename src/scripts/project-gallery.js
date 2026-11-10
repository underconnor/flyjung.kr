const galleries = new WeakSet();

export function initProjectGalleries(root = document) {
  for (const gallery of root.querySelectorAll('[data-project-gallery]')) {
    if (galleries.has(gallery)) continue;
    const cards = [...gallery.querySelectorAll('[data-gallery-card]')];
    if (!cards.length) continue;
    const storageKey = gallery.dataset.galleryProject ? `flyjung.project-gallery.${gallery.dataset.galleryProject}` : '';
    function savedIndex() {
      if (!storageKey) return 0;
      try {
        const value = JSON.parse(window.sessionStorage.getItem(storageKey));
        return Number.isInteger(value) && value >= 0 && value < cards.length ? value : 0;
      } catch {
        return 0;
      }
    }
    let current = 0;
    function select(index, keyboard = false, persist = true) {
      gallery.classList.toggle('is-keyboard', keyboard);
      current = (index + cards.length) % cards.length;
      for (const [position, card] of cards.entries()) {
        card.dataset.position = String((position - current + cards.length) % cards.length);
        card.setAttribute('aria-pressed', String(position === current));
        card.setAttribute('aria-label', position === current && cards.length > 1
          ? `${card.dataset.caption} · Next image: ${cards[(current + 1) % cards.length].dataset.caption}`
          : `Show ${card.dataset.caption}`);
      }
      gallery.querySelector('[data-gallery-status]').textContent = cards[current].dataset.caption;
      if (persist && storageKey) {
        try { window.sessionStorage.setItem(storageKey, JSON.stringify(current)); } catch { /* Keep the deck usable without storage. */ }
      }
      if (keyboard) cards[current].focus({ preventScroll: true });
    }
    for (const [index, card] of cards.entries()) {
      card.addEventListener('dragstart', event => {
        event.preventDefault();
        event.stopPropagation();
      });
      card.addEventListener('click', event => {
        event.stopPropagation();
        select(index === current ? current + 1 : index, event.detail === 0);
      });
      card.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        select(current + (event.key === 'ArrowLeft' ? -1 : 1), true);
      });
    }
    galleries.add(gallery);
    // Restore deck order without treating the initial view as an animated input.
    const transitions = cards.map(card => card.style.transition);
    for (const card of cards) card.style.transition = 'none';
    select(savedIndex(), false, false);
    void gallery.offsetWidth;
    for (const [index, card] of cards.entries()) {
      if (transitions[index]) card.style.transition = transitions[index];
      else card.style.removeProperty('transition');
    }
  }
}
