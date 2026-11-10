import { activities, awards, careers, cvIdentity, education } from '../data/cv.mjs';
import { escapeHTML } from '../html.mjs';

function renderDetails(details = []) {
  const items = details.filter(detail => typeof detail === 'string' && detail.trim());
  return items.length ? `<ul class="cv-row-details">${items.map(detail => `<li>${escapeHTML(detail)}</li>`).join('')}</ul>` : '';
}

function renderRow(entry, { title = entry.organization, subtitle = entry.role } = {}) {
  const organization = entry.href
    ? `<a href="${escapeHTML(entry.href)}">${escapeHTML(title)}</a>`
    : escapeHTML(title);

  return `<li class="cv-row">
    <p class="cv-row-period${entry.period ? '' : ' cv-row-period-empty'}">${escapeHTML(entry.period || '')}</p>
    <div class="cv-row-content">
      <h3 class="cv-row-organization">${organization}${entry.subtitle ? `<br><span class="cv-row-subtitle">${escapeHTML(entry.subtitle)}</span>` : ''}</h3>
      ${subtitle ? `<p class="cv-row-role">${escapeHTML(subtitle)}</p>` : ''}
      ${renderDetails(entry.details)}
    </div>
  </li>`;
}

export function renderCV() {
  return `<div class="cv-page">
    <header class="cv-intro">
      <h1>CV</h1>
      <p class="cv-name">정지원 <span lang="en">Jiwon Jung</span></p>
      <p>${escapeHTML(cvIdentity)}</p>
    </header>
    ${careers.length ? `<section class="cv-section" aria-labelledby="cv-career-title"><h2 id="cv-career-title">Employment</h2><ul class="cv-list">${careers.map(entry => renderRow(entry)).join('')}</ul></section>` : ''}
    <section class="cv-section" aria-labelledby="cv-activities-title">
      <h2 id="cv-activities-title">Experience</h2>
      <ul class="cv-list">${activities.map(entry => renderRow(entry)).join('')}</ul>
    </section>
    <section class="cv-section" aria-labelledby="cv-education-title">
      <h2 id="cv-education-title">Education</h2>
      <ul class="cv-list">${education.map(entry => renderRow(entry, { subtitle: entry.department })).join('')}</ul>
    </section>
    <section class="cv-section" aria-labelledby="cv-awards-title">
      <h2 id="cv-awards-title">Awards</h2>
      <ul class="cv-list">${awards.map(entry => renderRow(entry, { title: entry.title, subtitle: entry.distinction })).join('')}</ul>
    </section>
  </div>`;
}
