const mascot = document.querySelector('#flight-mascot');
const image = document.querySelector('[data-mascot-image]');
const fallback = document.querySelector('.mascot-fallback');
const flyButton = document.querySelector('#fly-button');
const status = document.querySelector('#flight-status');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

function showMascotImage() {
  if (!image.complete || !image.naturalWidth) return;
  image.hidden = false;
  fallback.setAttribute('hidden', '');
}
image.addEventListener('load', showMascotImage);
showMascotImage();

let flight;
flyButton.addEventListener('click', async () => {
  if (flight) return;
  if (motionPreference.matches || typeof mascot.animate !== 'function') {
    status.textContent = '오리와 종이비행기는 여기서 쉬어 갑니다.';
    return;
  }
  flyButton.disabled = true;
  flyButton.setAttribute('aria-busy', 'true');
  status.textContent = '한 바퀴 도는 중입니다.';
  const smallScreen = window.matchMedia('(max-width: 700px)').matches;
  const distance = smallScreen ? 18 : 36;
  flight = mascot.animate([
    { transform: 'translate(0, 0) rotate(0deg)' },
    { transform: `translate(${distance}px, -28px) rotate(-5deg)`, offset: .3 },
    { transform: `translate(-${distance}px, -44px) rotate(4deg)`, offset: .65 },
    { transform: 'translate(0, 0) rotate(0deg)' },
  ], { duration: 1900, easing: 'ease-in-out' });
  try { await flight.finished; } catch { /* A motion preference change can cancel the flight. */ }
  flight = null;
  flyButton.disabled = false;
  flyButton.removeAttribute('aria-busy');
  status.textContent = '잘 다녀왔습니다.';
});
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) flight?.cancel();
});
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector('#main');
  main.focus();
  main.scrollIntoView();
});
