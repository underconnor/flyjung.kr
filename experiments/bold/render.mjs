import { renderConceptNavigation } from '../navigation.mjs';
import { escapeHTML as e } from '../../site/html.mjs';
import { projects } from '../../site/data/projects.mjs';
import * as cv from '../../site/data/cv.mjs';

export const sloganOptions = [
  { id: 'maybe', text: 'From maybe to made.', lines: ['From maybe', 'to made.'], meaning: '아이디어를 실제로 만드는 태도' },
  { id: 'ideas', text: 'Ideas need a life outside my head.', lines: ['Ideas need a life', 'outside my head.'], meaning: '머릿속 생각을 바깥으로 꺼내는 호기심' },
  { id: 'notice', text: 'Things I make. Things I notice.', lines: ['Things I make.', 'Things I notice.'], meaning: '만드는 일과 관찰하는 일을 함께 기록하는 사람' },
];

function screenshots(project) {
  return project.images.map(image => `<figure class="screen-figure">
    <img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">
    <figcaption>${e(image.alt.replace(/^(신성인 앱의 |모무 앱의 )/, ''))}</figcaption>
  </figure>`).join('');
}

function projectSection(project) {
  const contribution = project.details.find(detail => detail.label === '직접 만든 부분');
  const decision = project.details.find(detail => detail.label === '설계 결정');
  const participation = project.id === 'momu' ? 'UNITHON에서 함께 만든 일상 미션 앱입니다.' : '급식 조회부터 별점과 한줄평, 학교 계정 인증까지 직접 구현했습니다.';
  return `<section class="project-section project-${e(project.id)}" id="${e(project.id)}" aria-labelledby="title-${e(project.id)}">
    <div class="project-layout content-width">
      <div class="project-copy">
        <p class="project-context">${e(project.id === 'shinsungin' ? '학교생활 앱' : '모무 · 일상 미션 앱')}</p>
        <h2 id="title-${e(project.id)}">${e(project.id === 'momu' ? 'MOMU' : project.title)}</h2>
        <p class="project-summary">${e(project.summary)}</p>
        <p class="project-participation">${e(participation)}</p>
        ${contribution ? `<ul class="contributions">${contribution.paragraphs.map(item => `<li>${e(item)}</li>`).join('')}</ul>` : ''}
        ${decision ? `<p class="project-decision">${e(decision.paragraphs.join(' '))}</p>` : ''}
        <p class="project-role">${e(project.role)}</p>
        <a class="text-link" href="https://flyjung.kr/projects/#${e(project.id)}">프로젝트 자세히 보기 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="project-screens">${screenshots(project)}</div>
    </div>
  </section>`;
}

export function renderConcept() {
  const activities = cv.activities;
  const first = sloganOptions[0];
  return `<!doctype html>
<html lang="ko" data-slogan="${first.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#294acc">
<meta name="description" content="flyjung.kr의 별도 로컬 디자인 시안. 기존 공개 사이트는 유지됩니다.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>flyjung — Bold concept</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/concept.css">
<script type="module" src="/concept.js"></script>
</head>
<body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
${renderConceptNavigation('bold')}
<header class="site-header content-width">
  <a class="wordmark" href="#top" aria-label="flyjung 첫 화면">flyjung<span aria-hidden="true">.</span></a>
  <nav aria-label="시안 메뉴"><a href="#work">만든 것</a><a href="#about">활동</a><a href="http://127.0.0.1:4319/blog/">Blog</a></nav>
</header>
<main id="main" tabindex="-1">
<section class="hero content-width" id="top" aria-labelledby="slogan-title">
  <div class="slogan-control">
    <label for="slogan-select">슬로건 비교 <span>가안</span></label>
    <select id="slogan-select" name="slogan" aria-controls="slogan-title slogan-meaning">${sloganOptions.map(slogan => `<option value="${slogan.id}">${e(slogan.text)}</option>`).join('')}</select>
  </div>
  <h1 class="hero-title" id="slogan-title" lang="en" aria-live="polite" aria-atomic="true">${first.lines.map(line => `<span>${e(line)}</span>`).join('')}</h1>
  <div class="hero-bottom">
    <div class="identity"><p lang="en">Jiwon Jung</p><p>정지원 · 숭실대학교</p></div>
    <p class="slogan-meaning" id="slogan-meaning">${e(first.meaning)}</p>
    <a class="work-jump" href="#work">만든 것 보기 <span aria-hidden="true">↓</span></a>
  </div>
  ${sloganOptions.map(slogan => `<template id="slogan-${slogan.id}" data-meaning="${e(slogan.meaning)}">${slogan.lines.map(line => `<span>${e(line)}</span>`).join('')}</template>`).join('')}
</section>
<div class="work-intro content-width" id="work"><p>지금까지 만든 것</p><p>신성인과 모무</p></div>
${projects.map(projectSection).join('')}
<section class="about-section" id="about" aria-labelledby="about-title">
  <div class="about-layout content-width">
    <div class="about-heading"><h2 id="about-title">함께한<br>활동들.</h2><a class="text-link" href="https://flyjung.kr/cv/">전체 이력 보기 <span aria-hidden="true">↗</span></a></div>
    <div class="about-details">
      <ul class="activities">${activities.map(entry => `<li><div><h3>${e(entry.organization)}</h3><p>${e(entry.role)}</p></div><p class="activity-period">${e(entry.period)}</p></li>`).join('')}</ul>
      <div class="recognition"><h3>수상</h3><ul>${cv.awards.map(award => `<li>${e(award.title)}<span>${e(award.distinction)}</span></li>`).join('')}</ul></div>
      <div class="education"><h3>학력</h3>${cv.education.map(entry => `<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div>
    </div>
  </div>
</section>

</main>
<footer class="site-footer content-width"><a href="#top" class="footer-name" aria-label="처음으로">flyjung.</a><div><p>Jiwon Jung</p><p>© 2026 flyjung.kr</p><a href="http://127.0.0.1:4319/">공개 사이트</a></div></footer>
</body></html>`;
}
