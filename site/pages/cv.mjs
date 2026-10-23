import { activities, awards, careers, cvIdentity, cvProjects, education } from '../data/cv.mjs';
import { escapeHTML } from '../html.mjs';

function renderExperienceRow(entry) {
  const organization = entry.href
    ? `<a href="${escapeHTML(entry.href)}">${escapeHTML(entry.organization)}</a>`
    : escapeHTML(entry.organization);

  return `<li class="cv-row">
    <p class="cv-row-organization">${organization}</p>
    <div class="cv-row-meta">
      <p class="cv-row-role">${escapeHTML(entry.role)}</p>
      <p class="cv-row-period">${escapeHTML(entry.period)}</p>
    </div>
  </li>`;
}

export function renderCV() {
  return `<div class="cv-page">
    <div class="cv-intro">
      <h1>CV</h1>
      <p>${escapeHTML(cvIdentity)}</p>
    </div>
    ${careers.length ? `<section class="cv-section" aria-labelledby="cv-career-title"><h2 id="cv-career-title">경력</h2><ul class="cv-list">${careers.map(renderExperienceRow).join('')}</ul></section>` : ''}
    <section class="cv-section" aria-labelledby="cv-activities-title">
      <h2 id="cv-activities-title">활동</h2>
      <ul class="cv-list">${activities.map(renderExperienceRow).join('')}</ul>
    </section>
    <section class="cv-section" aria-labelledby="cv-projects-title">
      <h2 id="cv-projects-title">프로젝트</h2>
      <ul class="cv-list">${cvProjects.map(renderExperienceRow).join('')}</ul>
    </section>
    <section class="cv-section" aria-labelledby="cv-education-title">
      <h2 id="cv-education-title">학력</h2>
      <ul class="cv-list cv-simple-list">${education.map(entry => `<li>
        <p>${escapeHTML(entry.organization)}</p>
        <p class="cv-detail-meta">${escapeHTML(entry.period)}</p>
      </li>`).join('')}</ul>
    </section>
    <section class="cv-section" aria-labelledby="cv-awards-title">
      <h2 id="cv-awards-title">수상</h2>
      <ul class="cv-list cv-simple-list">${awards.map(entry => `<li>${escapeHTML(entry.title)} · ${escapeHTML(entry.distinction)}</li>`).join('')}</ul>
    </section>
  </div>`;
}
