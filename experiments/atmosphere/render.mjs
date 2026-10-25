import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { careers, activities, awards, education, cvIdentity } from '../../site/data/cv.mjs';
import { renderConceptNavigation } from '../navigation.mjs';

const publicSite = 'http://127.0.0.1:4319';
const projectTitle = project => project.id === 'momu' ? '모무' : project.title;
const cvRows = (rows, kind) => `<ul class="cv-rows">${rows.map((row,index)=>`<li id="${kind}-${index}" tabindex="-1"><div><h3>${e(row.organization)}</h3><p>${e(row.role || '')}</p></div><span>${e(row.period)}</span></li>`).join('')}</ul>`;
const projectDetail = project => `<details class="project-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.role} ${project.summary}`)}"><summary><span class="row-name">${e(projectTitle(project))}</span><span class="row-description">${e(project.summary)}</span><span class="row-role">${e(project.role)}</span><span class="row-toggle" aria-hidden="true">+</span></summary><div class="project-detail">${project.details.map(detail=>`<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(paragraph=>`<p>${e(paragraph)}</p>`).join('')}</div>`).join('')}<a href="${publicSite}/projects/#${e(project.id)}">프로젝트 화면 보기</a></div></details>`;
const projectStars = projects.slice(0,2).map((project,index)=>`<a class="record-star project-star-${index}" href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}"><span class="ascii-star" aria-hidden="true">${index?'✧':'*'}</span><span>${e(projectTitle(project))}<small>${e(project.role)}</small></span></a>`).join('');

export function renderConcept() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#090f35"><meta name="description" content="정지원의 프로젝트와 활동, 별과 비행기가 있는 하늘."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><title>정지원 · Atmosphere</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/atmosphere.css"><script type="module" src="/atmosphere.js"></script></head><body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>${renderConceptNavigation('atmosphere')}
<div class="atmosphere-sky" id="top">
  <div class="star-dust" aria-hidden="true"><pre class="dust-one">   .               +                       .
             .                .
  +                      *                       .
         .          .                    +
                       .          .
    .         +                        .
                .              +             .</pre><pre class="dust-two">.                 .                  +
       *                    .
                   .               .
  .                         +
             .                     .
       +               .                    .</pre></div>
  <header class="site-header content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">*</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="${publicSite}/blog/">Blog</a></nav></header>
  <main id="main" tabindex="-1">
    <section class="sky-intro content-width" aria-labelledby="identity-title">
      <div class="identity"><p class="hello">안녕하세요,</p><h1 id="identity-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature" lang="en">${e(signature)}</p><p class="intro-copy">숭실대학교에서 공부하며<br>서비스를 만들고 기획합니다.</p><a class="read-cv" href="#cv">이력부터 읽기 <span aria-hidden="true">↓</span></a></div>
      <div class="open-sky" aria-label="좋아하는 비행기와 작업의 별">
        ${projectStars}
        <section class="aircraft" aria-labelledby="aircraft-label"><h2 id="aircraft-label">좋아하는 비행기, 787</h2><div id="atmosphere-aircraft" class="aircraft-stage" aria-label="787을 참고한 문자 비행기" aria-describedby="aircraft-instructions"><p class="loading">787을 불러오는 중입니다.</p></div><div class="aircraft-controls" hidden><div><button type="button" data-mode="ascii" aria-pressed="true">문자</button><button type="button" data-mode="solid" aria-pressed="false">입체</button><button type="button" id="aircraft-reset">처음 각도</button></div><a href="/flight-lab/">움직임 실험실</a></div><p id="aircraft-instructions">드래그 · 방향키로 돌려 보기</p><p id="aircraft-status" class="sr-only" role="status"></p></section>
        ${activities[0]?`<a class="record-star activity-star" href="#activity-0"><span class="ascii-star" aria-hidden="true">+</span><span>${e(activities[0].organization)}<small>${e(activities[0].role)}</small></span></a>`:''}
      </div>
    </section>
    <div class="air-depth content-width"><p>별을 누르면, 그 기록으로 이어집니다.</p><span aria-hidden="true">. &nbsp; + &nbsp; .</span></div>
    <div class="ground">
      <section class="cv-section content-width" id="cv" aria-labelledby="cv-title"><div class="section-title"><h2 id="cv-title">CV</h2><p>${e(cvIdentity)}</p><a href="${publicSite}/cv/">전체 이력 보기</a></div><div class="cv-content">${careers.length?`<div class="cv-group"><h3 class="group-title">경력</h3>${cvRows(careers,'career')}</div>`:''}<div class="cv-group"><h3 class="group-title">활동</h3>${cvRows(activities,'activity')}</div><div class="cv-small"><div><h3 class="group-title">학력</h3>${education.map(entry=>`<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div><div><h3 class="group-title">수상</h3>${awards.map(award=>`<p>${e(award.title)}<span>${e(award.distinction)}</span></p>`).join('')}</div></div></div></section>
      <section class="featured-section content-width" id="projects" aria-labelledby="projects-title"><div class="section-top"><h2 id="projects-title">먼저 볼 프로젝트</h2><a href="#all-projects">전체 목록</a></div><div class="featured-projects">${pinnedProjects.slice(0,2).map(project=>`<article class="featured-project"><div><p class="project-role">${e(project.role)}</p><h3>${e(projectTitle(project))}</h3><p class="project-summary">${e(project.summary)}</p><a href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}">만든 과정 보기</a></div><figure><img src="${e(project.images[0].src)}" width="${project.images[0].width}" height="${project.images[0].height}" alt="${e(project.images[0].alt)}" loading="lazy" decoding="async"></figure></article>`).join('')}</div></section>
      <section class="catalog-section content-width" id="all-projects" aria-labelledby="catalog-title"><div class="section-top"><h2 id="catalog-title">전체 프로젝트</h2><form class="project-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input id="project-search" type="search" name="q" placeholder="이름, 역할, 내용" maxlength="100" autocomplete="off"><button type="reset">초기화</button></form></div><p id="project-count" role="status">${projects.length}개의 프로젝트</p>${projects.map(projectDetail).join('')}<p id="project-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
      <footer class="site-footer content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">*</span></a><p>정지원 · Jiwon Jung</p><a href="${publicSite}/blog/">블로그 읽기</a></footer>
    </div>
  </main>
</div></body></html>`;
}
