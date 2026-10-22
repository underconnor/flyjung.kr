import { escapeHTML as e } from '../html.mjs';
import { projects } from '../data/projects.mjs';
import { cvExperiences, awards } from '../data/cv.mjs';
import { publishedPosts } from '../data/blog.mjs';
import { renderArticleRow } from './blog.mjs';

function heading(eyebrow,title,description='') {
  return `<div class="home-section-heading${description?'':' home-heading-short'}"><p class="home-eyebrow">${eyebrow}</p><h2>${title}</h2>${description?`<p class="home-section-description">${description}</p>`:''}</div>`;
}
export function renderHome() {
  const experienceRows=[...cvExperiences,...awards.map(award=>({period:'수상',title:award.title,role:award.distinction}))];
  return `<div class="home-page">
<section class="home-hero" aria-labelledby="home-title">
  <p class="home-eyebrow">PORTFOLIO · CV · BLOG</p>
  <h1 id="home-title">Jiwon Jung</h1>
  <p class="home-intro">개발 · 기획<br>숭실대학교 재학 중</p>
</section>
<section class="home-section home-experience" aria-label="경력과 활동">
  ${heading('CV','경력과 활동')}
  <ul class="home-experience-list">${experienceRows.map((item,index)=>`<li class="home-experience-row"><p class="home-period${index===2?' home-period-muted':''}">${e(item.period)}</p><div class="home-experience-copy"><h3>${e(item.title)}</h3><p>${e(item.role)}</p></div></li>`).join('')}</ul>
</section>
<section class="home-section home-work" aria-label="프로젝트">
  ${heading('SELECTED WORK','프로젝트','문제를 정의하고 구현까지 연결한 프로젝트입니다.')}
  <div class="home-projects">${projects.map(project=>`<article class="home-project"><div class="home-project-copy"><p class="home-project-category"><span>${e(project.number)}</span>${e(project.category)}</p><h3>${e(project.title)}</h3><p class="home-project-description">${e(project.summary)}</p><p class="home-project-role">${e(project.role)}</p></div><a class="home-more" href="/projects/#${project.id}" aria-label="${e(project.title)} 더 보기">더 보기 →</a></article>`).join('')}</div>
</section>
<section class="home-section home-writing" aria-label="블로그">
  ${heading('BLOG','블로그','프로젝트, 개발, PM·기획, 활동·회고를 기록합니다.')}
  ${publishedPosts.length ? `<div class="home-writing-list">${publishedPosts.slice(0,3).map(renderArticleRow).join('')}<a class="home-more" href="/blog/">모든 글 보기 →</a></div>` : `<div class="home-blog-empty"><p class="home-blog-label">BLOG STATUS</p><h3>아직 게시된 글이 없습니다</h3><p>작성 중인 글은 공개 목록에 표시하지 않습니다.</p></div>`}
</section></div>`;
}