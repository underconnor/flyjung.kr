import { blogCategories, getPublishedPosts, publishedPosts, validatePublishedPost } from '../data/blog.mjs';
import { escapeHTML } from '../html.mjs';

export { publishedPosts };

function categoryLabel(id) {
  return blogCategories.find(category => category.id === id)?.label || '기록';
}

function postURL(post) {
  return `/blog/${post.slug}/`;
}

function dateLabel(date) {
  return String(date).replaceAll('-', '.');
}

export function renderArticleRow(post) {
  validatePublishedPost(post);
  const search = [post.title, post.summary, categoryLabel(post.category)].filter(Boolean).join(' ');
  return `<article class="blog-post" data-blog-post data-category="${escapeHTML(post.category)}" data-search="${escapeHTML(search)}">
    <div class="blog-post-copy">
      <h2 class="blog-post-title"><a href="${postURL(post)}">${escapeHTML(post.title)}</a></h2>
      <p class="blog-post-category">${escapeHTML(categoryLabel(post.category))}</p>
    </div>
    <time class="blog-post-date" datetime="${escapeHTML(post.date)}">${escapeHTML(dateLabel(post.date))}</time>
  </article>`;
}

export function renderBlog({ posts = publishedPosts } = {}) {
  const visiblePosts = getPublishedPosts(posts);
  const categories = blogCategories.map(category => `<button class="blog-category" type="button" data-blog-category="${category.id}" aria-pressed="${category.id === 'all'}">${category.label}</button>`).join('\n');
  return `<div class="blog-page" data-blog>
    <h1 class="blog-title">글</h1>
    <div class="blog-filters">
      <div class="blog-categories" role="group" aria-label="글 분류">${categories}</div>
      <form class="blog-search" role="search" action="/blog/" method="get" data-blog-search>
        <label class="blog-visually-hidden" for="blog-search-input">글 검색</label>
        <input id="blog-search-input" name="q" type="search" placeholder="글 검색" autocomplete="off" spellcheck="false" aria-controls="blog-results">
        <button class="blog-visually-hidden blog-submit" type="submit">검색</button>
      </form>
    </div>
    <section class="blog-results" id="blog-results" aria-label="글 목록">
      <div class="blog-posts" data-blog-posts${visiblePosts.length ? '' : ' hidden'}>${visiblePosts.map(renderArticleRow).join('\n')}</div>
      <div class="blog-empty" data-blog-empty${visiblePosts.length ? ' hidden' : ''}>
        <h2>아직 공개한 글이 없습니다.</h2>
        <p>첫 글을 준비하고 있습니다.</p>
      </div>
      <div class="blog-empty" data-blog-no-results hidden>
        <h2>검색 결과가 없습니다.</h2>
        <p>다른 검색어나 분류로 다시 찾아보세요.</p>
        <button class="blog-reset" type="button" data-blog-reset>검색 조건 초기화</button>
      </div>
      <p class="blog-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-blog-announcement></p>
    </section>
  </div>`;
}

export function renderBlogPost(post, { preview = false } = {}) {
  validatePublishedPost(post);
  return `<article class="blog-article">
    ${preview ? '' : '<a class="blog-back" href="/blog/">← 글 목록</a>'}
    <header class="blog-article-header">
      <p class="blog-post-category">${escapeHTML(categoryLabel(post.category))}</p>
      <h1>${escapeHTML(post.title)}</h1>
      <time class="blog-post-date" datetime="${escapeHTML(post.date)}">${escapeHTML(dateLabel(post.date))}</time>
    </header>
    <div class="blog-article-body">${post.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('\n')}</div>
  </article>`;
}
