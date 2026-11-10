import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPublishedPosts, validatePublishedPost } from '../site/data/blog.mjs';
import { renderArticleRow, renderBlog, renderBlogPost } from '../site/pages/blog.mjs';
import { filterPosts, normalizeBlogState, readBlogState } from '../src/scripts/blog.js';

const article = {
  status: 'published',
  slug: 'a-public-note',
  title: '공개 글',
  category: 'notes',
  date: '2026-10-22',
  paragraphs: ['검토를 마친 본문입니다.'],
};

test('published content validates required fields and real calendar dates', () => {
  assert.equal(validatePublishedPost(article), article);
  assert.doesNotThrow(() => validatePublishedPost({ ...article, date: '2024-02-29' }));
  for (const [field, value, message] of [
    ['slug', '../private', /slug/],
    ['slug', '한글-slug', /slug/],
    ['title', '  ', /title/],
    ['category', 'all', /category/],
    ['category', 'unknown', /category/],
    ['date', '2026-02-29', /calendar date/],
    ['date', '2026-04-31', /calendar date/],
    ['date', '2026-13-01', /calendar date/],
    ['date', '2026-1-01', /calendar date/],
    ['paragraphs', [], /paragraphs/],
    ['paragraphs', ['  '], /paragraphs/],
    ['paragraphs', ['정상 문단', 42], /paragraphs/],
    ['summary', {}, /summary/],
  ]) {
    assert.throws(() => validatePublishedPost({ ...article, [field]: value }), message, `${field}: ${JSON.stringify(value)}`);
  }
});

test('publication ignores incomplete drafts, rejects duplicate published URLs, and keeps source order', () => {
  const draft = { status: 'draft', slug: article.slug, title: 'PRIVATE DRAFT' };
  const older = { ...article, slug: 'an-older-note', date: '2026-10-01' };
  const source = [draft, older, article];
  assert.deepEqual(getPublishedPosts(source), [article, older]);
  assert.deepEqual(source, [draft, older, article]);
  assert.throws(() => getPublishedPosts([article, { ...article }]), /Duplicate published blog slug/);
  assert.doesNotMatch(renderBlog({ posts: source }), /PRIVATE DRAFT/);
});

test('all blog render entry points reject unpublished or incomplete content', () => {
  const invalid = { ...article, paragraphs: [] };
  assert.throws(() => renderBlog({ posts: [invalid] }), /paragraphs/);
  assert.throws(() => renderArticleRow(invalid), /paragraphs/);
  assert.throws(() => renderBlogPost(invalid), /paragraphs/);
  assert.throws(() => renderArticleRow({ ...article, status: 'draft' }), /Draft/);
  assert.throws(() => renderBlogPost({ ...article, status: 'draft' }), /Draft/);
  const escaped = { ...article, title: '<script>title</script>', paragraphs: ['<img src=x onerror=alert(1)>'] };
  assert.match(renderArticleRow(escaped), /&lt;script&gt;/);
  assert.match(renderBlogPost(escaped), /&lt;img/);
  assert.doesNotMatch(renderBlogPost(escaped), /<script>|<img\b/);
});

test('search recognizes any rendered category without a duplicate client whitelist', () => {
  const categories = new Set(['all', 'new-category']);
  const posts = [
    { category: 'new-category', title: '새 분류 글' },
    { category: 'notes', title: '기존 글' },
  ];
  assert.deepEqual(readBlogState('?category=new-category&q=%EC%83%88', categories), {
    category: 'new-category', query: '새',
  });
  assert.deepEqual(filterPosts(posts, { category: 'new-category' }, categories), [posts[0]]);
  assert.deepEqual(filterPosts(posts, { category: 'new-category' }), [posts[0]]);
  assert.deepEqual(filterPosts([], { category: 'new-category' }, categories), []);
  assert.equal(normalizeBlogState({ category: 'not-rendered' }, categories).category, 'all');
});
