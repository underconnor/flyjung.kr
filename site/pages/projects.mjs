import { projects } from '../data/projects.mjs';
import { escapeHTML } from '../html.mjs';
import { renderProjectGallery } from '../project-gallery.mjs';
import { renderProjectLinks } from '../project-links.mjs';

function renderProject(project) {
  const textOnly = !project.images.length;
  const meta = project.role + (project.period ? ` · ${project.period.replace(/\s*—\s*/g, '–')}` : '');
  return `<article class="project-card${textOnly ? ' project-card-text' : ''}">
    <details class="project-disclosure${textOnly ? ' project-disclosure-text' : ''}" name="portfolio-project" id="${project.id}" data-project-id="${project.id}">
    <summary class="project-summary" id="${project.id}-toggle" aria-controls="${project.id}-panel">
      <span class="project-heading"><span class="project-title" role="heading" aria-level="2">${escapeHTML(project.title)}</span><span class="project-symbol" aria-hidden="true">+</span><span class="project-collapse" aria-hidden="true">−</span></span>
      <span class="project-preview-copy">${escapeHTML(project.description)}</span>
      <span class="project-meta">${escapeHTML(meta)}</span>
    </summary>
    <div class="project-panel" id="${project.id}-panel" role="region" aria-labelledby="${project.id}-toggle">
      ${textOnly ? '' : renderProjectGallery(project, { id: `public-${project.id}` })}
      <div class="project-body">
        ${renderProjectLinks(project)}
        <dl class="project-facts">${project.details.map(detail => `<div class="project-fact"><dt>${escapeHTML(detail.label)}</dt><dd>${detail.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('')}</dd></div>`).join('')}</dl>
      </div>
    </div>
    </details>
  </article>`;
}

export function renderProjects() {
  return `<div class="projects-page"><h1 class="projects-title">Projects</h1><div class="projects-list" data-project-list>${projects.map(renderProject).join('')}</div></div>`;
}
