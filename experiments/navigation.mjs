import { escapeHTML as e } from '../site/html.mjs';

export const conceptRoutes = [
  { id: 'night', label: '별자리', href: '/' },
  { id: 'terminal', label: '787 ASCII', href: '/terminal/' },
  { id: 'horizon', label: 'Horizon', href: '/horizon/' },
  { id: 'daybreak', label: 'Daybreak', href: '/daybreak/' },
  { id: 'atmosphere', label: 'Atmosphere', href: '/atmosphere/' },
  { id: 'constellation', label: '별과 787', href: '/constellation/' },
  { id: 'sky-trail', label: '별의 항로', href: '/sky-trail/' },
  { id: 'descent', label: 'Descent', href: '/descent/' },
  { id: 'orbit', label: 'Orbit', href: '/orbit/' },
  { id: 'flight-lab', label: '비행 실험실', href: '/flight-lab/' },
  { id: 'constellation-lab', label: '별자리 실험실', href: '/constellation-lab/' },
  { id: 'hangar', label: '787 3D', href: '/hangar/' },
  { id: 'studio', label: 'Indigo', href: '/indigo/' },
  { id: 'flight', label: 'Flight', href: '/flight/' },
  { id: 'bold', label: 'Cobalt', href: '/archive/' },
];

export function renderConceptNavigation(current) {
  const active = conceptRoutes.find(route => route.id === current);
  if (!active) throw new Error(`Unknown concept: ${current}`);
  return `<nav class="concept-navigation" aria-label="전체 시안"><div class="concept-navigation-inner"><details class="concept-picker"><summary><span>시안 선택</span><strong>${e(active.label)}</strong><span aria-hidden="true">⌄</span></summary><div class="concept-options">${conceptRoutes.map(route => `<a href="${route.href}"${route.id === current ? ' aria-current="page"' : ''}>${e(route.label)}${route.id === current ? '<span aria-hidden="true">✓</span>' : ''}</a>`).join('')}</div></details><div class="concept-shortcuts"><a href="/constellation-lab/">별자리 실험실</a><a href="http://127.0.0.1:4319/">공개 사이트</a></div></div></nav>`;
}
