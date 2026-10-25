import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { careers, activities, awards, education, cvIdentity } from '../../site/data/cv.mjs';
import { renderConceptNavigation } from '../navigation.mjs';

const publicSite = 'http://127.0.0.1:4319';
const projectName = project => project.id === 'momu' ? '모무' : project.title;
const activityId = index => `activity-${index}`;

const stars = [
  { id: 'shinsungin', title: projectName(pinnedProjects[0]), meta: 'Full Stack · 2023—2025', href: '#detail-shinsungin', type: 'project', show: 'all' },
  { id: 'momu', title: projectName(pinnedProjects[1]), meta: 'UNITHON · 2026', href: '#detail-momu', type: 'project', show: 'all' },
  { id: 'meals', title: '급식 조회·별점', meta: '신성인', href: '#detail-shinsungin', type: 'feature', show: 'sparse,records,wide' },
  { id: 'auth', title: '학교 계정 인증', meta: '신성인', href: '#detail-shinsungin', type: 'feature', show: 'sparse,wide' },
  { id: 'mission', title: '오늘의 미션', meta: '모무', href: '#detail-momu', type: 'feature', show: 'sparse,records,wide' },
  { id: 'feed', title: '미션 기록과 피드', meta: '모무', href: '#detail-momu', type: 'feature', show: 'sparse,wide' },
  { id: 'it', title: 'IT지원위원회', meta: 'PM · 2026—현재', href: '#activity-0', type: 'activity', show: 'records,wide,radar' },
  { id: 'pron', title: 'PRON', meta: '2024 기장', href: '#activity-2', type: 'activity', show: 'records,wide,radar' },
  { id: 'council', title: 'AI대학 학생회', meta: '학생회 활동', href: '#activity-1', type: 'activity', show: 'wide,radar' },
  { id: 'award', title: 'SSU Bug Bounty', meta: '장려상', href: '#award-0', type: 'award', show: 'wide,radar' },
];

function starNode(star) {
  const projectId = star.type === 'project' ? star.id : star.type === 'feature' ? (['meals', 'auth'].includes(star.id) ? 'shinsungin' : 'momu') : null;
  return `<a class="sky-star sky-star-${e(star.id)}" href="${e(star.href)}" data-star="${e(star.id)}" data-show="${e(star.show)}"${projectId ? ` data-open-project="detail-${e(projectId)}"` : ''}><span class="star-dot" aria-hidden="true"></span><span class="star-copy"><strong>${e(star.title)}</strong><small>${e(star.meta)}</small></span></a>`;
}

function radarGrid() {
  const ticks = Array.from({ length: 36 }, (_, index) => {
    const angle = index * Math.PI / 18;
    const inner = index % 3 === 0 ? 251 : 258;
    const x1 = 300 + Math.sin(angle) * inner, y1 = 300 - Math.cos(angle) * inner;
    const x2 = 300 + Math.sin(angle) * 265, y2 = 300 - Math.cos(angle) * 265;
    return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`;
  }).join('');
  return `<svg class="radar-grid" viewBox="0 0 600 600" aria-hidden="true" focusable="false"><defs><linearGradient id="radar-sweep" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#79a7db" stop-opacity="0"/><stop offset="1" stop-color="#9ed8ff" stop-opacity=".24"/></linearGradient></defs><path class="radar-sector" d="M300 300 L420 88 A245 245 0 0 1 526 205 Z" fill="url(#radar-sweep)"/><g class="radar-ranges"><circle cx="300" cy="300" r="85"/><circle cx="300" cy="300" r="165"/><circle cx="300" cy="300" r="245"/></g><g class="radar-axis"><line x1="300" y1="30" x2="300" y2="570"/><line x1="30" y1="300" x2="570" y2="300"/></g><g class="radar-ticks">${ticks}</g><line class="radar-bearing" x1="300" y1="300" x2="526" y2="205"/><circle class="radar-center" cx="300" cy="300" r="3"/></svg>`;
}

function cvRows(entries, kind) {
  return `<ul class="cv-rows">${entries.map((entry, index) => `<li id="${kind}-${index}" tabindex="-1"><div><h4>${e(entry.organization)}</h4><p>${e(entry.role || '')}</p></div><span>${e(entry.period)}</span></li>`).join('')}</ul>`;
}

function featured(project) {
  const image = project.images[0];
  return `<article class="featured-project"><div><p class="project-role">${e(project.role)}</p><h3>${e(projectName(project))}</h3><p>${e(project.summary)}</p><a href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}">프로젝트 자세히 보기</a></div><figure><img src="${e(image.src)}" width="${image.width}" height="${image.height}" alt="${e(image.alt)}" loading="lazy" decoding="async"></figure></article>`;
}

function projectRow(project) {
  return `<details class="project-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.role} ${project.summary} ${project.meta}`)}"><summary><span class="row-name">${e(projectName(project))}</span><span class="row-summary">${e(project.summary)}</span><span class="row-role">${e(project.role)}</span><span class="row-toggle" aria-hidden="true">+</span></summary><div class="project-detail">${project.details.map(detail => `<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}</div>`).join('')}<a href="${publicSite}/projects/#${e(project.id)}">프로젝트 화면 보기</a></div></details>`;
}

export function renderConcept() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0a1238"><meta name="description" content="정지원의 프로젝트와 활동을 점 별자리로 배치한 실험 화면."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><title>정지원 · 별자리 실험실</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/constellation-lab.css"><script type="module" src="/constellation-lab.js"></script></head><body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>${renderConceptNavigation('constellation-lab')}
<div class="sky-page" id="top"><header class="site-header content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">.</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="${publicSite}/blog/">Blog</a></nav></header>
<main id="main" tabindex="-1">
<section class="sky-intro content-width" aria-labelledby="identity-title"><div class="identity"><p class="hello">안녕하세요,</p><h1 id="identity-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature" lang="en">${e(signature)}</p><p class="intro-copy">숭실대학교에서 공부하며<br>서비스를 만들고 기획합니다.</p><a class="read-cv" href="#cv">이력부터 읽기 <span aria-hidden="true">↓</span></a></div><div class="plane-stage"><div id="lab-aircraft" class="aircraft-scene" role="img" aria-label="보잉 787을 참고한 문자 비행기"><span class="loading">787</span></div></div></section>
<section class="chart-section content-width" id="sky-chart" aria-labelledby="chart-title"><div class="chart-header"><h2 id="chart-title">기록의 별자리</h2><div class="lab-options" role="group" aria-label="별자리 표현 비교"><button type="button" data-layout="sparse" aria-pressed="false">두 프로젝트</button><button type="button" data-layout="records" aria-pressed="true">프로젝트와 활동</button><button type="button" data-layout="wide" aria-pressed="false">넓은 기록</button><button type="button" data-layout="radar" aria-pressed="false">레이더</button></div></div><div class="sky-stage" data-layout="records" aria-label="프로젝트와 활동의 별자리">${radarGrid()}<svg class="constellation-lines" aria-hidden="true" focusable="false"><line data-connect="shinsungin:momu" data-kind="project"></line><line data-connect="shinsungin:meals" data-kind="project"></line><line data-connect="shinsungin:auth" data-kind="project"></line><line data-connect="momu:mission" data-kind="project"></line><line data-connect="momu:feed" data-kind="project"></line><line data-connect="pron:it" data-kind="activity"></line><line data-connect="it:council" data-kind="activity"></line></svg>${stars.map(starNode).join('')}</div></section><div class="sky-to-ground" aria-hidden="true"></div>
<div class="ground"><section class="cv-section content-width" id="cv" aria-labelledby="cv-title"><div class="section-title"><h2 id="cv-title">CV</h2><p>${e(cvIdentity)}</p><a href="${publicSite}/cv/">전체 이력 보기</a></div><div class="cv-content">${careers.length ? `<div class="cv-group"><h3>경력</h3>${cvRows(careers, 'career')}</div>` : ''}<div class="cv-group"><h3>활동</h3>${cvRows(activities, 'activity')}</div><div class="cv-small"><div><h3>학력</h3>${education.map(item => `<p>${e(item.organization)}<span>${e(item.period)}</span></p>`).join('')}</div><div><h3>수상</h3>${awards.map((item, index) => `<p id="award-${index}" tabindex="-1">${e(item.title)}<span>${e(item.distinction)}</span></p>`).join('')}</div></div></div></section>
<section class="featured-section content-width" id="projects" aria-labelledby="projects-title"><div class="section-top"><h2 id="projects-title">먼저 볼 프로젝트</h2><a href="#all-projects">전체 목록</a></div><div class="featured-projects">${pinnedProjects.slice(0, 2).map(featured).join('')}</div></section>
<section class="catalog-section content-width" id="all-projects" aria-labelledby="catalog-title"><div class="section-top"><h2 id="catalog-title">전체 프로젝트</h2><form class="project-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input id="project-search" type="search" name="q" placeholder="이름, 역할, 내용" maxlength="100" autocomplete="off"><button type="reset">초기화</button></form></div><p id="project-count" role="status">${projects.length}개의 프로젝트</p>${projects.map(projectRow).join('')}<p id="project-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
<footer class="site-footer content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">.</span></a><p>정지원 · Jiwon Jung</p><a href="${publicSite}/blog/">블로그 읽기</a></footer></div></main></div></body></html>`;
}
