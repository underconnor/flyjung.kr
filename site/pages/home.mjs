import { escapeHTML as e } from '../html.mjs';
import { projects } from '../data/projects.mjs';
import { activities, careers, awards } from '../data/cv.mjs';
import { publishedPosts } from '../data/blog.mjs';
import { renderArticleRow } from './blog.mjs';

function heading(eyebrow,title,description='') {
  return `<div class="home-section-heading${description?'':' home-heading-short'}"><p class="home-eyebrow">${eyebrow}</p><h2>${title}</h2>${description?`<p class="home-section-description">${description}</p>`:''}</div>`;
}
export function renderHome() {
  const renderEntries = entries => entries.map(item=>`<li class="home-experience-row"><p class="home-period">${e(item.period)}</p><div class="home-experience-copy"><h3>${e(item.organization)}</h3><p>${e(item.role)}</p></div></li>`).join('');
  return `<div class="home-page">
<section class="home-hero" aria-labelledby="home-title">
  <p class="home-eyebrow">PORTFOLIO · CV · BLOG</p>
  <h1 id="home-title">Jiwon Jung</h1>
  <p class="home-intro">개발 · 기획<br>숭실대학교 재학 중</p>
</section>
${careers.length ? `<section class="home-section home-experience" aria-label="경력">${heading('CV','경력')}<ul class="home-experience-list">${renderEntries(careers)}</ul></section>` : ''}
<section class="home-section home-experience" aria-label="활동">
  ${heading('CV','활동')}
  <ul class="home-experience-list">${renderEntries(activities)}</ul>
  <div class="home-awards" aria-labelledby="home-awards-title"><h2 id="home-awards-title">수상</h2><ul>${awards.map(award=>`<li><span>${e(award.title)}</span><span>${e(award.distinction)}</span></li>`).join('')}</ul></div>
</section>
<section class="home-section home-work" aria-label="프로젝트">
  ${heading('SELECTED WORK','프로젝트','문제를 정의하고 구현까지 연결한 프로젝트입니다.')}
  <div class="home-projects">${projects.map(project=>`<article class="home-project"><div class="home-project-copy"><p class="home-project-category"><span>${e(project.number)}</span>${e(project.category)}</p><h3>${e(project.title)}</h3><p class="home-project-description">${e(project.summary)}</p><p class="home-project-role">${e(project.role)}</p></div><a class="home-more" href="/projects/#${project.id}" aria-label="${e(project.title)} 더 보기">더 보기 →</a></article>`).join('')}</div>
</section>
<section class="home-section home-writing" aria-label="블로그">
  ${heading('BLOG','블로그','프로젝트, 개발, PM·기획, 활동·회고를 기록합니다.')}
  ${publishedPosts.length ? `<div class="home-writing-list">${publishedPosts.slice(0,3).map(renderArticleRow).join('')}<a class="home-more" href="/blog/">모든 글 보기 →</a></div>` : `<div class="home-blog-empty"><h3>첫 글을 준비하고 있습니다</h3><p>만드는 과정에서 고민한 것과 배운 것을 이곳에 남깁니다.</p><a class="home-more" href="/blog/">블로그 보기 →</a></div>`}
</section></div>`;
}
