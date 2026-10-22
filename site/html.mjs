export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}
export const routes = [
  { href: '/projects/', label: 'Projects', key: 'projects' },
  { href: '/blog/', label: 'Blog', key: 'blog' },
  { href: '/cv/', label: 'CV', key: 'cv' },
];