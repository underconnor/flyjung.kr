import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecentPosts, isRecentPostDate, recentPostWindow, seoulDate } from '../src/scripts/recent-posts.js';
const now = new Date('2026-11-09T03:00:00Z');
test('recent Blog window is one calendar month in Seoul, inclusive without future dates', () => {
  assert.deepEqual(recentPostWindow(now), { start: '2026-10-09', end: '2026-11-09' });
  for (const date of ['2026-10-09', '2026-11-09']) assert.equal(isRecentPostDate(date, now), true);
  for (const date of ['2026-10-08', '2026-11-10', '2026-02-30', 'bad']) assert.equal(isRecentPostDate(date, now), false);
});
test('month ends clamp correctly and the boundary changes at Seoul midnight', () => {
  assert.deepEqual(recentPostWindow('2026-03-31T03:00:00Z'), { start: '2026-02-28', end: '2026-03-31' });
  assert.deepEqual(recentPostWindow('2024-03-31T03:00:00Z'), { start: '2024-02-29', end: '2024-03-31' });
  assert.deepEqual(recentPostWindow('2026-01-31T03:00:00Z'), { start: '2025-12-31', end: '2026-01-31' });
  assert.equal(seoulDate('2026-11-08T14:59:59Z'), '2026-11-08');
  assert.equal(seoulDate('2026-11-08T15:00:00Z'), '2026-11-09');
});
test('zero, one, and many published posts have no artificial cap or draft records', () => {
  const posts = Array.from({ length: 40 }, (_, index) => ({ slug: 'post-' + index, date: '2026-11-01', status: 'published' }));
  const input = [...posts, { slug: 'draft', date: '2026-11-08', status: 'draft' }, { slug: 'old', date: '2026-10-08', status: 'published' }, { slug: 'future', date: '2026-11-10', status: 'published' }];
  assert.equal(getRecentPosts([], now).length, 0);
  assert.equal(getRecentPosts(posts.slice(0, 1), now).length, 1);
  assert.equal(getRecentPosts(input, now).length, 40);
  assert.equal(input.length, 43);
});

test('home meteors link only published posts and preserve current-window visibility without commit placeholders', async () => {
  const { renderHome } = await import('../site/home/render.mjs');
  const article = (slug, date, status = 'published') => ({ slug, date, status, title: slug, category: 'development', paragraphs: ['QA content'] });
  const html = renderHome({ now, posts: [
    article('new', '2026-11-08'), article('month-boundary', '2026-10-09'),
    article('old', '2026-10-08'), article('future', '2026-11-10'),
    article('draft-secret', '2026-11-09', 'draft'),
  ] });
  assert.match(html, /data-recent-count="2"/);
  assert.match(html, /href="\/blog\/new\/"/);
  assert.match(html, /href="\/blog\/old\/" hidden/);
  assert.match(html, /href="\/blog\/future\/" hidden/);
  assert.doesNotMatch(html, /draft-secret|github\.com\/underconnor\/flyjung\.kr\/commit\//);
});
