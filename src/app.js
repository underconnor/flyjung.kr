import { initProjects } from './scripts/projects.js';
import { initBlog } from './scripts/blog.js';
document.querySelector('.skip-link')?.addEventListener('click', event => {
  const main = document.querySelector('#main');
  if (!main) return;
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: 'start' });
});
if (document.body.dataset.page === 'projects') initProjects();
if (document.body.dataset.page === 'blog') initBlog();
