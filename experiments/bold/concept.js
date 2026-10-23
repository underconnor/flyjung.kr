const select = document.querySelector('#slogan-select');
const heading = document.querySelector('#slogan-title');
const meaning = document.querySelector('#slogan-meaning');

function applySlogan(value, updateURL = false) {
  const option = [...select.options].find(item => item.value === value) || select.options[0];
  const template = document.querySelector(`#slogan-${option.value}`);
  select.value = option.value;
  heading.replaceChildren(template.content.cloneNode(true));
  meaning.textContent = template.dataset.meaning;
  document.documentElement.dataset.slogan = option.value;
  if (updateURL) {
    const url = new URL(location.href);
    if (option.value === select.options[0].value) url.searchParams.delete('slogan');
    else url.searchParams.set('slogan', option.value);
    history.replaceState(null, '', url);
  }
}

applySlogan(new URL(location.href).searchParams.get('slogan'));
select.addEventListener('change', () => applySlogan(select.value, true));
window.addEventListener('popstate', () => applySlogan(new URL(location.href).searchParams.get('slogan')));
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main.focus();
  main.scrollIntoView();
});
