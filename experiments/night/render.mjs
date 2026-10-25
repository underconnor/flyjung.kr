import { renderConceptNavigation } from '../navigation.mjs';
import { escapeHTML as e } from '../../site/html.mjs';
import { activities, careers, awards, education, cvIdentity } from '../../site/data/cv.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';

const title = project => project.id === 'momu' ? '모무' : project.title;

function cvRows(entries) {
  return entries.map(entry => `<li><div><h3>${e(entry.organization)}</h3><p>${e(entry.role)}</p></div><p class="cv-period">${e(entry.period)}</p></li>`).join('');
}

function pinned(project) {
  const preview = project.images[0];
  return `<article class="pinned-project"><div class="pinned-copy"><p class="project-role">${e(project.role)}</p><h3>${e(title(project))}</h3><p class="project-summary">${e(project.summary)}</p><a href="http://127.0.0.1:4319/projects/#${e(project.id)}" class="text-link">프로젝트 보기 <span aria-hidden="true">↗</span></a></div><figure><img src="${e(preview.src)}" alt="${e(preview.alt)}" width="${preview.width}" height="${preview.height}" loading="lazy" decoding="async"></figure></article>`;
}

function catalogRow(project) {
  const search = `${project.title} ${project.summary} ${project.role} ${project.meta}`;
  return `<details class="catalog-row" data-project data-search="${e(search)}"><summary><span class="catalog-title">${e(title(project))}</span><span class="catalog-summary">${e(project.summary)}</span><span class="catalog-role">${e(project.role)}</span><span class="catalog-toggle" aria-hidden="true">+</span></summary><div class="catalog-detail">${project.details.map(detail => `<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(text=>`<p>${e(text)}</p>`).join('')}</div>`).join('')}<a class="text-link" href="http://127.0.0.1:4319/projects/#${e(project.id)}">화면과 상세 보기 <span aria-hidden="true">↗</span></a></div></details>`;
}

export function renderConcept() {
  const parts = signature === 'Somewhere between code and stars.' ? ['Somewhere', 'between code', 'and stars.'] : [signature];
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#090f35">
<meta name="description" content="정지원의 프로젝트와 활동. 코드와 별 사이, flyjung.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'">
<title>flyjung — Somewhere between code and stars.</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/night.css"><script type="module" src="/night.js"></script>
</head>
<body>
<a href="#main" class="skip-link">본문으로 건너뛰기</a>
${renderConceptNavigation('night')}
<header class="site-header page-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">✦</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="http://127.0.0.1:4319/blog/">Blog</a></nav></header>
<main id="main" tabindex="-1">
  <section class="hero" id="top" aria-labelledby="hero-title">
    <canvas id="night-sky" aria-hidden="true"></canvas>
    <div class="page-width hero-content">
      <div class="hero-copy"><h1 id="hero-title" lang="en">${parts.map(part=>`<span>${e(part)}</span>`).join('')}</h1><div class="hero-intro"><p>정지원<span>Jiwon Jung</span></p><p>개발하고 기획합니다.<br>만든 것과 함께한 일을 이곳에 남깁니다.</p></div></div>
      <div class="star-navigation" aria-label="별을 따라 둘러보기"><a href="#cv" data-star="cv" class="star-link star-cv"><span class="star-point" aria-hidden="true"></span>CV</a><a href="#projects" data-star="projects" class="star-link star-projects"><span class="star-point" aria-hidden="true"></span>Projects</a><a href="http://127.0.0.1:4319/blog/" data-star="writing" class="star-link star-writing"><span class="star-point" aria-hidden="true"></span>Blog</a></div>
      <div class="sky-control"><div class="sky-actions"><button id="connect-stars" type="button" aria-pressed="true" hidden><span aria-hidden="true">✧</span> 별자리 선</button><button id="find-duck" type="button" aria-pressed="false" hidden>오리자리 찾기</button></div><p id="sky-caption" aria-live="polite">CV, 작업, 기록을 별로 이었습니다.</p></div>
    </div>
  </section>
  <section class="cv-section" id="cv" aria-labelledby="cv-title"><div class="page-width cv-layout">
    <div class="section-heading"><h2 id="cv-title">CV</h2><p>${e(cvIdentity)}</p><a class="text-link" href="http://127.0.0.1:4319/cv/">전체 이력 보기 <span aria-hidden="true">↗</span></a></div>
    <div class="cv-content">${careers.length?`<div class="cv-group"><h3 class="cv-group-title">경력</h3><ul class="cv-list">${cvRows(careers)}</ul></div>`:''}<div class="cv-group"><h3 class="cv-group-title">활동</h3><ul class="cv-list">${cvRows(activities)}</ul></div><div class="cv-extra"><div><h3 class="cv-group-title">수상</h3>${awards.map(award=>`<p>${e(award.title)}<span>${e(award.distinction)}</span></p>`).join('')}</div><div><h3 class="cv-group-title">학력</h3>${education.map(entry=>`<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div></div></div>
  </div></section>
  <section class="projects-section page-width" id="projects" aria-labelledby="projects-title"><div class="section-top"><h2 id="projects-title">고정 프로젝트</h2><a href="#all-projects">전체 목록 보기 <span aria-hidden="true">↓</span></a></div><div class="pinned-grid">${pinnedProjects.slice(0,2).map(pinned).join('')}</div></section>
  <section class="catalog-section page-width" id="all-projects" aria-labelledby="catalog-title"><div class="catalog-heading"><h2 id="catalog-title">전체 프로젝트</h2><form class="catalog-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input type="search" id="project-search" name="q" placeholder="이름, 역할, 내용 검색" autocomplete="off"><button type="reset">초기화</button></form></div><p id="catalog-count" class="catalog-count" aria-live="polite">${projects.length}개의 프로젝트</p><div class="catalog-list">${projects.map(catalogRow).join('')}</div><p id="catalog-empty" class="catalog-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>

</main>
<footer class="site-footer page-width"><a href="#top" class="footer-name">flyjung</a><p>© 2026 Jiwon Jung</p><a href="#top">처음으로</a></footer>
</body></html>`;
}
