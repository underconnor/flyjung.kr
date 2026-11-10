import { escapeHTML as e } from './html.mjs';

export function renderProjectGallery(project, { id = project.id } = {}) {
  if (!project.images.length) return '';
  const images = project.images.slice(0, 3);
  const portrait = images[0].height > images[0].width;
  const wide = images[0].width / images[0].height > 1.85;
  return `<section class="project-gallery${portrait ? ' project-gallery-portrait' : ''}${wide ? ' project-gallery-wide' : ''}" data-project-gallery data-gallery-project="${e(project.id)}" aria-label="${e(project.title)} 화면">
<div class="project-gallery-stack">${images.map((image, index) => `<button type="button" class="project-gallery-card" draggable="false" data-gallery-card data-position="${index}" data-caption="${e(image.caption || image.alt)}" aria-label="${e(image.caption || image.alt)} 보기" aria-pressed="${index === 0}"><img src="${e(image.src)}" width="${image.width}" height="${image.height}" alt="${e(image.alt)}" draggable="false" loading="lazy" decoding="async"></button>`).join('')}</div>
<span id="${e(id)}-status" class="project-gallery-sr" data-gallery-status aria-live="polite">${e(images[0].caption || images[0].alt)}</span>
</section>`;
}
