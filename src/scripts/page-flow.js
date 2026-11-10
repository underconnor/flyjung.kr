/* Parser-blocking registration catches pagereveal before the first paint. */
(() => {
  const contextKey = 'flyjung:home-context';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (location.hash) document.documentElement.classList.add('entering-fragment');
  let keyboard = false;
  const readContext = () => {
    try { return JSON.parse(sessionStorage.getItem(contextKey)); }
    catch { return null; }
  };
  const homePage = url => ['/', '/cruise/', '/cruise-story/'].includes(url.pathname);
  document.addEventListener('keydown', () => { keyboard = true; }, true);
  document.addEventListener('pointerdown', () => { keyboard = false; }, true);
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    if (event.detail === 0) keyboard = true;
    const current = new URL(location.href);
    const next = new URL(link.href);
    if (next.origin !== current.origin || !homePage(current) || next.pathname === current.pathname) return;
    const section = link.dataset.homeReturn || ({ '/cv/': 'cv', '/projects/': 'all-projects', '/blog/': 'top' })[next.pathname];
    if (!section || !/^[a-z0-9-]+$/.test(section)) return;
    current.hash = section;
    try {
      sessionStorage.setItem(contextKey, JSON.stringify({ destination: next.pathname, fragment: next.hash, home: current.pathname + current.search + current.hash }));
    } catch { /* Normal links work when storage is unavailable. */ }
  });

  function updateHomeLink() {
    const link = document.querySelector('.page-trail a');
    if (!link) return;
    link.dataset.homeHref ||= link.getAttribute('href');
    link.href = link.dataset.homeHref;
    const context = readContext();
    if (context?.destination === location.pathname && context.fragment === location.hash && typeof context.home === 'string') {
      try {
        const home = new URL(context.home, location.origin);
        if (home.origin === location.origin && homePage(home)) {
          link.href = home.pathname + home.search + home.hash;
          return;
        }
      } catch { /* Ignore invalid or stale tab-local context. */ }
    }
    // A direct project URL still returns to that project's entry on the home page.
    if (location.pathname === '/projects/' && location.hash) {
      const project = [...document.querySelectorAll('[data-project-id]')].find(item => '#' + item.dataset.projectId === location.hash);
      if (project) link.href = '/#detail-' + project.dataset.projectId;
    }
  }
  function prepareTransition(event) {
    const transition = event.viewTransition;
    if (!transition) return;
    if (keyboard || reducedMotion.matches) {
      transition.skipTransition();
      return;
    }
    const header = document.querySelector('.site-header');
    const bounds = header?.getBoundingClientRect();
    if (bounds && bounds.top >= -1 && bounds.bottom <= innerHeight) {
      header.style.viewTransitionName = 'site-header';
      transition.finished.finally(() => { header.style.viewTransitionName = ''; });
    }
  }
  addEventListener('pageswap', prepareTransition);
  addEventListener('pagereveal', event => {
    const traversal = window.navigation?.activation?.navigationType === 'traverse' || performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    if (location.hash && !traversal) {
      let target;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* Keep malformed fragments harmless. */ }
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    updateHomeLink();
    prepareTransition(event);
  });
  addEventListener('pageshow', () => {
    keyboard = false;
    updateHomeLink();
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('entering-fragment')));
  });
  addEventListener('hashchange', updateHomeLink);
  addEventListener('popstate', updateHomeLink);
  document.addEventListener('toggle', updateHomeLink, true);
  document.addEventListener('DOMContentLoaded', updateHomeLink, { once: true });
})();
