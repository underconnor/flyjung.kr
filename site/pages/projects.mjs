import { projects } from '../data/projects.mjs';
import { escapeHTML } from '../html.mjs';

function renderMedia(project, preview = false) {
  return `<div class="project-media${preview ? ' project-media-preview' : ''}">${project.images.map(image => `<img class="project-screen" src="${escapeHTML(image.src)}" alt="${preview ? '' : escapeHTML(image.alt)}" width="${image.width || 420}" height="${image.height || 912}" loading="eager" decoding="async">`).join('')}</div>`;
}

function renderProject(project) {
  return `<details class="project-disclosure" name="portfolio-project" id="${project.id}" data-project-id="${project.id}">
    <summary class="project-summary" id="${project.id}-toggle" aria-controls="${project.id}-panel">
      ${renderMedia(project, true)}
      <span class="project-heading"><span class="project-title" role="heading" aria-level="2">${escapeHTML(project.title)}</span><span class="project-symbol" aria-hidden="true">+</span><span class="project-collapse" aria-hidden="true">접기 −</span></span>
      <span class="project-meta">${escapeHTML(project.meta)}</span>
    </summary>
    <div class="project-panel" id="${project.id}-panel" role="region" aria-labelledby="${project.id}-toggle">
      <p class="project-description">${escapeHTML(project.description)}</p>
      <div class="project-body">
        ${renderMedia(project)}
        <dl class="project-facts">${project.details.map(detail => `<div class="project-fact"><dt>${escapeHTML(detail.label)}</dt><dd>${detail.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}</dd></div>`).join('')}</dl>
      </div>
    </div>
  </details>`;
}

export function renderProjects() {
  return `<div class="projects-page"><h1 class="projects-title">프로젝트</h1><div class="projects-list" data-project-list>${projects.map(renderProject).join('')}</div></div>`;
}
