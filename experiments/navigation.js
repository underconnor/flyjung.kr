const pickers = [...document.querySelectorAll('.concept-picker')];
document.addEventListener('click', event => {
  for (const picker of pickers) if (!picker.contains(event.target)) picker.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  for (const picker of pickers) if (picker.open) {
    picker.open = false;
    picker.querySelector('summary').focus();
    event.preventDefault();
  }
});
