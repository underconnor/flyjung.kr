// Native anchors work without JavaScript; explicitly transfer skip-link focus.
document.querySelector('.skip-link')?.addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main.focus();
  main.scrollIntoView();
});
