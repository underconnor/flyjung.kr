import { escapeHTML as e } from '../../site/html.mjs';
import { projects } from '../../site/data/projects.mjs';
import { activities, awards, education } from '../../site/data/cv.mjs';

function projectSection(project) {
  const personal = project.id === 'shinsungin';
  const title = personal ? project.title : 'MOMU';
  const description = personal
    ? '급식과 공지, 학교 계정 정보를 한곳에 모았습니다. 조회부터 별점과 한줄평, 계정 인증까지 직접 구현했습니다.'
    : 'UNITHON에서 함께 만든 일상 미션 앱입니다. 오늘의 작은 미션과 그 기록을 나눌 수 있습니다.';
  return `<section class="project project-${e(project.id)}" id="${e(project.id)}" aria-labelledby="${e(project.id)}-title">
    <div class="project-copy">
      <h3 id="${e(project.id)}-title">${e(title)}</h3>
      <p class="project-kind">${personal ? '학교생활 앱' : '모무, 일상 미션 앱'}</p>
      <p class="project-description">${e(description)}</p>
      <p class="project-role">${e(project.role)}</p>
      <a class="detail-link" href="https://flyjung.kr/projects/#${e(project.id)}">프로젝트 자세히 보기</a>
    </div>
    <div class="project-media">
      ${project.images.map(image => `<figure><img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"><figcaption>${e(image.alt.replace(/^(신성인 앱의 |모무 앱의 )/, ''))}</figcaption></figure>`).join('')}
    </div>
  </section>`;
}

export function renderConcept() {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#ffffff">
<meta name="description" content="정지원의 프로젝트와 활동. 이름과 실제 작업을 중심으로 만든 별도 비교 시안.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>Jiwon Jung — 인디고 타이포</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/studio.css">
<script type="module" src="/studio.js"></script>
</head>
<body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
<aside class="comparison" aria-label="시안 비교">
  <div class="comparison-inner page-width">
    <p>시안 비교</p>
    <nav aria-label="디자인 시안"><a href="/">밤하늘</a><a href="/terminal/">터미널</a><a href="/hangar/">787 3D</a><a href="/indigo/" aria-current="page">이전 인디고</a><a href="http://127.0.0.1:4319/">기존 안</a></nav>
  </div>
</aside>
<header class="site-header page-width">
  <a class="brand" href="#top">flyjung</a>
  <nav aria-label="주 메뉴"><a href="#work">만든 것</a><a href="#about">활동</a><a href="#writing">기록</a></nav>
</header>
<main id="main" tabindex="-1">
  <section class="hero page-width" id="top" aria-labelledby="hero-title">
    <h1 id="hero-title" lang="en"><span>Jiwon</span> <span>Jung.</span></h1>
    <div class="hero-intro">
      <p class="name-intro">정지원입니다.</p>
      <div class="intro-copy"><p>기획하고, 직접 만듭니다.</p><p>숭실대학교에서 공부하며<br>앱을 만들고, 학교 안의 일에 참여하고 있습니다.</p></div>
      <a class="work-link" href="#work">만든 것 보기<span aria-hidden="true">↓</span></a>
    </div>
  </section>
  <section class="work page-width" id="work" aria-labelledby="work-title">
    <h2 class="section-title" id="work-title">만든 것</h2>
    ${projects.map(projectSection).join('')}
  </section>
  <section class="about page-width" id="about" aria-labelledby="about-title">
    <div class="section-intro"><h2 id="about-title">학교에서<br>함께한 일</h2><a class="detail-link" href="https://flyjung.kr/cv/">전체 이력 보기</a></div>
    <div class="about-content">
      <ul class="activity-list">${activities.map(entry => `<li><div><h3>${e(entry.organization)}</h3><p>${e(entry.role)}</p></div><p class="period">${e(entry.period)}</p></li>`).join('')}</ul>
      <div class="about-extra"><h3>수상</h3><ul>${awards.map(award => `<li><span>${e(award.title)}</span><span>${e(award.distinction)}</span></li>`).join('')}</ul></div>
      <div class="about-extra"><h3>학력</h3><ul>${education.map(entry => `<li><span>${e(entry.organization)}</span><span>${e(entry.period)}</span></li>`).join('')}</ul></div>
    </div>
  </section>
  <section class="writing page-width" id="writing" aria-labelledby="writing-title">
    <h2 id="writing-title">기록</h2>
    <div><p>만들면서 배운 것과<br>그때의 생각을 남길 곳입니다.</p><p class="writing-status">아직 공개한 글은 없습니다.</p><a class="detail-link" href="https://flyjung.kr/blog/">블로그 보기</a></div>
  </section>
</main>
<footer class="site-footer page-width"><a href="#top" class="footer-brand" aria-label="첫 화면으로">flyjung</a><div><p>정지원 / Jiwon Jung</p><p>© 2026 flyjung.kr</p></div></footer>
</body>
</html>`;
}
