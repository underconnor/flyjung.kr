const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function seoulDate(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(date.getTime())) throw new TypeError('A valid current date is required');
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = name => parts.find(part => part.type === name).value;
  return [value('year'), value('month'), value('day')].join('-');
}

export function recentPostWindow(now = new Date()) {
  const end = seoulDate(now);
  const [year, month, day] = end.split('-').map(Number);
  const lastPreviousDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const start = new Date(Date.UTC(year, month - 2, Math.min(day, lastPreviousDay)))
    .toISOString().slice(0, 10);
  return { start, end };
}

export function isRecentPostDate(value, now = new Date()) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const { start, end } = recentPostWindow(now);
  return value >= start && value <= end;
}

export function getRecentPosts(posts, now = new Date()) {
  return posts.filter(post => post?.status === 'published' && isRecentPostDate(post.date, now))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
