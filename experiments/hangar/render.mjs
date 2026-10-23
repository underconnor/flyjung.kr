import { escapeHTML as e } from '../../site/html.mjs';
import { activities, awards, education } from '../../site/data/cv.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';

export function renderConcept() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#080c24">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="description" content="정지원의 프로젝트와 활동, 직접 돌려 보는 787 3D 스케치.">
  <title>flyjung — 787 in the night</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/hangar.css">
  <script type="module" src="/hangar.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <aside class="comparison"><nav class="page-width" aria-label="시안 비교"><span>시안 비교</span><a href="/">밤하늘</a><a href="/terminal/">터미널</a><a href="/hangar/" aria-current="page">787 3D</a><a href="http://127.0.0.1:4319/">기존 사이트</a></nav></aside>
  <header class="site-header page-width"><a href="#top" class="wordmark">flyjung.</a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#work">Projects</a><a href="http://127.0.0.1:4319/blog/">Blog</a></nav></header>
  <main id="main" tabindex="-1">
    <section class="hero page-width" id="top" aria-labelledby="hero-title">
      <div class="hero-copy"><h1 id="hero-title" lang="en">${e(signature)}</h1><p class="hero-name">정지원 <span>Jiwon Jung</span></p><p class="hero-intro">개발하고 기획합니다.<br>비행기 중에서는 787을 좋아합니다.</p></div>
      <div class="aircraft-viewer">
        <div class="model-surface" id="model-surface" tabindex="0" role="group" aria-label="직접 돌려 보는 787 3D 모델" aria-describedby="model-help">
          <canvas id="aircraft-canvas" aria-hidden="true"></canvas>
          <canvas id="aircraft-fallback" aria-hidden="true" hidden></canvas>
          <span class="model-caption">Boeing 787 <span id="model-kind">3D sketch</span></span>
        </div>
        <div class="viewer-controls">
          <div class="view-buttons" role="group" aria-label="모델 시점"><button type="button" data-view="three" aria-pressed="true">사선</button><button type="button" data-view="front" aria-pressed="false">정면</button><button type="button" data-view="side" aria-pressed="false">측면</button><button type="button" data-view="top" aria-pressed="false">위</button></div>
          <div class="secondary-controls"><button type="button" id="wire-toggle" aria-pressed="false">선으로 보기</button><button type="button" id="model-reset">처음 시점</button></div>
          <label class="zoom-control" for="model-zoom">크기 <input id="model-zoom" type="range" min="75" max="150" value="100" step="5"><output id="zoom-value" for="model-zoom">100%</output></label>
        </div>
        <p id="model-help" class="model-help">드래그하거나 방향키로 돌려 보세요.</p>
        <p id="model-status" class="model-status" role="status" aria-live="polite">787의 곡선을 참고해 만든 3D 스케치입니다.</p>
      </div>
    </section>
    <section class="cv-section page-width" id="cv" aria-labelledby="cv-title">
      <div class="section-heading"><h2 id="cv-title">CV</h2><p>숭실대학교에서 공부하며<br>개발과 기획을 하고 있습니다.</p><a href="http://127.0.0.1:4319/cv/">전체 이력</a></div>
      <div class="cv-content"><h3 class="list-label">활동</h3><ul class="activity-list">${activities.map(item=>`<li><div><h4>${e(item.organization)}</h4><p>${e(item.role)}</p></div><p>${e(item.period)}</p></li>`).join('')}</ul><div class="cv-extra"><div><h3>수상</h3>${awards.map(item=>`<p>${e(item.title)}<span>${e(item.distinction)}</span></p>`).join('')}</div><div><h3>학력</h3>${education.map(item=>`<p>${e(item.organization)}<span>${e(item.period)}</span></p>`).join('')}</div></div></div>
    </section>
    <section class="work-section page-width" id="work" aria-labelledby="work-title"><div class="work-heading"><h2 id="work-title">Pinned projects</h2><p>직접 만든 것, 함께 만든 것.</p></div>
      <div class="pinned-projects">${pinnedProjects.slice(0,2).map(project=>`<article class="pinned-project"><div class="pinned-copy"><p class="project-role">${e(project.role)}</p><h3>${e(project.title)}</h3><p>${e(project.summary)}</p><a href="http://127.0.0.1:4319/projects/#${e(project.id)}">프로젝트 보기</a></div><div class="project-images">${(project.images||[]).slice(0,2).map(image=>`<img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">`).join('')}</div></article>`).join('')}</div>
      <div class="all-projects"><h3>모든 프로젝트</h3><div class="project-index"><div class="project-search"><label for="project-search">프로젝트 검색</label><input id="project-search" type="search" placeholder="제목, 역할, 내용" autocomplete="off" aria-describedby="project-count" aria-controls="project-list"><button type="button" id="project-search-reset" disabled>검색 지우기</button></div><p id="project-count" class="project-count" role="status" aria-live="polite">${projects.length}개 프로젝트</p><ul id="project-list">${projects.map(project=>`<li data-project-row data-search="${e([project.title,project.role,project.summary].join(' '))}"><a href="http://127.0.0.1:4319/projects/#${e(project.id)}"><span>${e(project.title)}</span><span>${e(project.role)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}</ul><p class="project-empty" id="project-empty" hidden>검색 결과가 없습니다. 다른 단어로 검색하거나 검색을 지워 주세요.</p></div></div>
    </section>
  </main>
  <footer class="site-footer page-width"><a class="wordmark" href="#top">flyjung.</a><p>정지원의 웹사이트</p><a href="http://127.0.0.1:4319/blog/">기록 보기</a></footer>
</body>
</html>`;
}
