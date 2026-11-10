import { escapeHTML as e } from './html.mjs';

function usableLink(link) {
  if (!link || typeof link.label !== 'string' || typeof link.href !== 'string') return false;
  try {
    const url = new URL(link.href);
    return url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === '127.0.0.1');
  } catch { return false; }
}

function renderLink(link, project, className = 'project-link') {
  return `<a class="${e(className)}${link.href === project.demoUrl ? ' project-gallery-service' : ''}" href="${e(link.href)}" target="_blank" rel="noopener noreferrer">${e(link.label)}<span aria-hidden="true">↗</span><span class="project-links-sr"> · 새 탭</span></a>`;
}

export function renderPrimaryProjectLink(project, { className = 'project-link' } = {}) {
  const primary = (project.links || []).find(link => {
    if (!usableLink(link) || link.label.trim().toLowerCase() !== 'github') return false;
    const url = new URL(link.href);
    return url.protocol === 'https:' && url.hostname === 'github.com';
  });
  return primary ? renderLink(primary, project, className) : '';
}

export function renderProjectLinks(project, { className = 'project-links', includeService = true } = {}) {
  const candidates = [
    ...(includeService && project.demoUrl ? [{ label: project.demoLabel || 'Visit site', href: project.demoUrl }] : []),
    ...(project.links || []),
  ];
  const seen = new Set();
  const links = candidates.filter(link => {
    if (!usableLink(link) || seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
  if (!links.length) return '';
  return `<nav class="${e(className)}" aria-label="${e(project.title)} links">${links.map(link => renderLink(link, project)).join('')}</nav>`;
}
