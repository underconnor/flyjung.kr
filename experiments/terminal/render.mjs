import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { careers, activities, awards, education } from '../../site/data/cv.mjs';
import { publishedPosts } from '../../site/data/blog.mjs';

const renderCVEntries = entries => `<ul class="activity-list">${entries.map(item => `<li><h4>${e(item.organization)}</h4><p>${e(item.role)}</p><p>${e(item.period)}</p></li>`).join('')}</ul>`;

export function renderConcept() {
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0a1648">
<meta name="description" content="정지원의 프로젝트와 활동을 명령과 787 문자 그래픽으로 둘러보는 별도 시안.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'">
<title>flyjung — ASCII flight</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/terminal.css"><script type="module" src="/terminal.js"></script>
</head><body>
<a href="#main" class="skip-link">본문으로 건너뛰기</a>
<aside class="comparison"><div class="page-width comparison-inner"><span>표현 방식 비교</span><nav aria-label="시안 비교"><a href="/">별자리</a><a href="/terminal/" aria-current="page">ASCII flight</a><a href="http://127.0.0.1:4319/">기존 사이트</a></nav></div></aside>
<header class="page-width site-header"><a class="brand" href="#top">flyjung<span aria-hidden="true">_</span></a><nav aria-label="주요 메뉴"><a href="#about">CV</a><a href="#work">Projects</a><a href="#writing">Notes</a></nav></header>
<main id="main" tabindex="-1">
<section class="page-width hero" id="top" aria-labelledby="hero-title">
  <div class="hero-layout">
    <div class="hero-intro"><p class="name-signature" lang="en">JIWON JUNG <span>— flyjung</span></p><h1 id="hero-title" lang="en">${e(signature)}</h1><p class="intro-copy">정지원입니다. 개발하고 기획하며,<br>좋아하는 것들을 이 공간에 남깁니다.</p><a class="hero-link" href="#about">조금 더 알아보기 <span aria-hidden="true">↘</span></a></div>
    <section class="aircraft-pane" aria-labelledby="aircraft-title">
      <svg class="sky-trail" viewBox="0 0 600 500" aria-hidden="true"><path class="flight-path" d="M40 460C10 350 180 440 270 330S420 170 574 90"/><path class="constellation" d="m57 115 70-46 64 52 76-31m172 287 65-24 47 49"/><g class="sky-stars"><circle cx="57" cy="115" r="2.5"/><circle cx="127" cy="69" r="3"/><circle cx="191" cy="121" r="2"/><circle cx="267" cy="90" r="2.5"/><circle cx="439" cy="377" r="2"/><circle cx="504" cy="353" r="3"/><circle cx="551" cy="402" r="2"/><circle cx="368" cy="45" r="1.5"/><circle cx="550" cy="188" r="1.2"/><circle cx="73" cy="322" r="1.2"/></g><path class="sky-cross" d="M359 100h10m-5-5v10M483 218h8m-4-4v8"/></svg>
      <div class="aircraft-caption"><h2 id="aircraft-title">Boeing 787</h2><p>made of characters.</p></div>
      <div class="ascii-stage" id="ascii-stage" tabindex="0" role="img" aria-label="787을 참고한 3차원 문자 그래픽. 드래그하거나 방향키로 회전합니다." aria-describedby="aircraft-help"><pre id="aircraft-ascii" aria-hidden="true">787
loading geometry...</pre></div>
      <div class="flight-controls"><div class="view-controls" aria-label="비행기 시점"><button type="button" data-view="perspective" aria-pressed="true">입체</button><button type="button" data-view="side" aria-pressed="false">옆</button><button type="button" data-view="front" aria-pressed="false">앞</button><button type="button" data-view="top" aria-pressed="false">위</button><button type="button" data-command="rotate reset" class="reset-view">초기화</button></div><p id="view-status" role="status">perspective</p></div>
      <p id="aircraft-help" class="aircraft-help">드래그 · 방향키로 돌려 보기</p>
    </section>
  </div>
  <details class="terminal" id="command-console"><summary><span class="terminal-title"><span aria-hidden="true">❯</span> 명령으로 둘러보기</span><span class="console-preview">help · work · view top</span><span class="console-toggle" aria-hidden="true">+</span></summary>
      <section class="command-pane" aria-label="명령과 결과">
        <p class="welcome-answer">work로 프로젝트를, view와 rotate로 787을 조작할 수 있습니다.</p>
        <div class="command-log" id="command-log" role="log" aria-live="polite" aria-relevant="additions text" tabindex="0"><div class="log-entry"><p class="log-command">❯ help</p><p class="log-answer">work, about, view top<br>명령을 입력하거나 아래 버튼을 눌러 보세요.</p></div></div>
        <form id="command-form" class="command-form" autocomplete="off"><label for="command-input" class="sr-only">포트폴리오 명령</label><span aria-hidden="true">❯</span><input id="command-input" name="command" placeholder="help" maxlength="80" autocomplete="off" spellcheck="false" autocapitalize="none" aria-describedby="command-help"><button type="submit" aria-label="명령 실행">실행</button></form>
        <p class="command-help" id="command-help">↑ ↓ 이전 명령 · Enter 실행</p>
        <div class="command-shortcuts" aria-label="바로 실행"><button type="button" data-command="work">work</button><button type="button" data-command="about">about</button><button type="button" data-command="help">help</button><button type="button" data-command="clear">clear</button></div>
      </section>
  </details>
</section>
<section class="page-width about-section" id="about" tabindex="-1" aria-labelledby="about-title"><div class="section-heading"><h2 id="about-title">CV</h2><p class="file-path">~/about</p></div>${careers.length ? `<div class="career-section"><h3 class="cv-label">경력</h3>${renderCVEntries(careers)}</div>` : ''}<h3 class="cv-label">활동</h3>${renderCVEntries(activities)}<div class="cv-extras"><div class="awards"><h3>수상</h3>${awards.map(item => `<p>${e(item.title)} <span>${e(item.distinction)}</span></p>`).join('')}</div><div class="awards"><h3>학력</h3>${education.map(item => `<p>${e(item.organization)} <span>${e(item.period)}</span></p>`).join('')}</div></div></section>
<section class="page-width work-section" id="work" tabindex="-1" aria-labelledby="work-title"><div class="section-heading"><h2 id="work-title">먼저 볼 프로젝트</h2><p class="file-path">~/pinned</p></div>
  ${pinnedProjects.slice(0,2).map(project => `<details class="project" id="${e(project.id)}" data-project="${e(project.id)}"><summary><span class="project-name">${e(project.title)}</span><span class="project-summary">${e(project.summary)}</span><span class="disclosure-mark" aria-hidden="true">+</span></summary><div class="project-body"><div class="project-copy"><p class="project-role">${e(project.role)}</p>${project.details.map(detail => `<div><h3>${e(detail.label)}</h3>${detail.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}</div>`).join('')}<a href="http://127.0.0.1:4319/projects/#${e(project.id)}">프로젝트 페이지 열기</a></div><div class="project-media">${project.images.map(image => `<figure><img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></figure>`).join('')}</div></div></details>`).join('')}
</section>
<section class="page-width all-projects" id="projects" aria-labelledby="projects-title"><div class="section-heading"><h2 id="projects-title">전체 프로젝트</h2><p class="file-path">~/projects</p></div><div class="project-search"><label for="project-search">프로젝트 검색</label><div><input type="search" id="project-search" maxlength="80" placeholder="이름이나 내용으로 찾기" autocomplete="off"><button type="button" id="project-search-reset" hidden>초기화</button></div><p id="project-search-count" role="status">${projects.length}개 프로젝트</p></div><ul id="project-list">${projects.map(project=>`<li><a href="http://127.0.0.1:4319/projects/#${e(project.id)}"><span>${e(project.title)}</span><span>${e(project.summary)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}</ul><p id="project-search-empty" class="empty-note" hidden>일치하는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
<section class="page-width writing-section" id="writing" aria-labelledby="writing-title"><div class="section-heading"><h2 id="writing-title">기록</h2><p class="file-path">~/notes</p></div><div>${publishedPosts.length ? `<ul class="notes-list">${publishedPosts.slice(0,2).map(post => `<li><a href="http://127.0.0.1:4319/blog/${e(post.slug)}/"><time datetime="${e(post.date)}">${e(post.date)}</time><span>${e(post.title)}</span></a></li>`).join('')}</ul>` : `<p>만들면서 배운 것과<br>그때의 생각을 남길 곳.</p><p class="empty-note">아직 공개한 글은 없습니다.</p>`}<a href="http://127.0.0.1:4319/blog/">블로그 열기</a></div></section>
</main><footer class="page-width site-footer"><a href="#top">flyjung_</a><p>정지원 / Jiwon Jung</p><a href="/">별자리 안과 비교</a></footer>
</body></html>`;
}
