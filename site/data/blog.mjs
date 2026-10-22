/**
 * Only author-approved articles belong here. The Figma article names and dates
 * are layout examples, not published writing.
 *
 * Article: { slug, title, category, date: 'YYYY-MM-DD', summary,
 *            paragraphs: string[], status: 'draft' | 'published' }
 * Category: any ID in blogCategories except 'all'.
 */
export const blogPosts = [];

export const blogCategories = [
  { id: 'all', label: '전체' },
  { id: 'development', label: '개발' },
  { id: 'projects', label: '프로젝트' },
  { id: 'notes', label: '기록' },
];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const hasText = value => typeof value === 'string' && value.trim().length > 0;

/** Reject incomplete published content before it reaches any public renderer. */
export function validatePublishedPost(post) {
  if (!post || post.status !== 'published') {
    throw new Error('Draft blog posts cannot be rendered publicly');
  }
  if (typeof post.slug !== 'string' || !slugPattern.test(post.slug)) {
    throw new Error('A published blog post needs a URL-safe slug');
  }
  const fail = message => { throw new Error(`Published blog post "${post.slug}": ${message}`); };
  if (!hasText(post.title)) fail('title must be non-empty text');
  if (post.category === 'all' || !blogCategories.some(category => category.id === post.category)) {
    fail('category must match a published blog category');
  }
  const date = typeof post.date === 'string' && datePattern.test(post.date)
    ? new Date(`${post.date}T00:00:00.000Z`)
    : null;
  if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== post.date) {
    fail('date must be a real calendar date in YYYY-MM-DD format');
  }
  if (!Array.isArray(post.paragraphs) || !post.paragraphs.length || !post.paragraphs.every(hasText)) {
    fail('paragraphs must contain non-empty text');
  }
  if (post.summary !== undefined && typeof post.summary !== 'string') {
    fail('summary must be text when provided');
  }
  return post;
}

export function getPublishedPosts(posts = blogPosts) {
  if (!Array.isArray(posts)) throw new TypeError('Blog posts must be an array');
  const published = posts.filter(post => post?.status === 'published');
  const slugs = new Set();
  for (const post of published) {
    validatePublishedPost(post);
    if (slugs.has(post.slug)) throw new Error(`Duplicate published blog slug: ${post.slug}`);
    slugs.add(post.slug);
  }
  return published.sort((a, b) => b.date.localeCompare(a.date));
}

export const publishedPosts = getPublishedPosts();
