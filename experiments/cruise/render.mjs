import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { activities, awards, careers, education } from '../../site/data/cv.mjs';
import { commitRecords } from '../commit-records.mjs';
import { renderConceptNavigation } from '../navigation.mjs';

const publicSite = 'http://127.0.0.1:4319';
const projectTitle = project => project.id === 'momu' ? '모무' : project.title;
const compactPeriod = period => period.replace(/\s*—\s*/g, '–');
const shortPeriod = period => {
  const years = period.match(/20[0-9]{2}/g) || [];
  if (years.length > 1) return `${years[0]}–${years[1].slice(-2)}`;
  const start = period.match(/20[0-9]{2}(?:\.[0-9]{2})?/)?.[0];
  return start ? `${start}${period.includes('현재') ? '~' : ''}` : compactPeriod(period);
};
const activityIndex = fragment => activities.findIndex(activity => activity.organization.includes(fragment));
const records = {
  pron: activityIndex('PRON'),
  ai: activityIndex('AI대학 학생회'),
  it: activityIndex('IT지원위원회'),
};
if (Object.values(records).some(index => index < 0)) throw new Error('Cruise constellation needs the three confirmed activities');
for (const id of ['shinsungin', 'momu']) {
  if (!pinnedProjects.some(project => project.id === id)) throw new Error(`Cruise constellation needs pinned project: ${id}`);
}

function seededRandom(seed) {
  let state = seed;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function starLayer(name, count, seed, radius, spread, opacity, variation) {
  const random = seededRandom(seed);
  return `<g class="sky-depth ${name}">${Array.from({ length: count }, () => {
    const x = (random() * 1200).toFixed(2);
    const y = (random() * 1780).toFixed(2);
    const r = (radius + random() * spread).toFixed(2);
    const alpha = (opacity + random() * variation).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" opacity="${alpha}"/>`;
  }).join('')}</g>`;
}
const skyDots = [
  starLayer('sky-depth-far', 115, 0x784afa, .28, .36, .2, .27),
  starLayer('sky-depth-mid', 42, 0x381fe2, .58, .5, .37, .28),
  starLayer('sky-depth-near', 14, 0x7137c4, 1.05, .78, .58, .28),
].join('');

function recordStar({ className, title, period, role, href, dataAttribute }) {
  const description = `${title}: ${role}, ${period}. 아래 상세 기록으로 이동`;
  return `<a class="star-node ${className}" href="${e(href)}" ${dataAttribute} aria-label="${e(description)}"><span class="star-core" aria-hidden="true"></span><span class="star-label"><strong>${e(title)}</strong><small class="period-full" aria-hidden="true">${e(compactPeriod(period))}</small><small class="period-short" aria-hidden="true">${e(shortPeriod(period))}</small></span></a>`;
}
const shinsungin = pinnedProjects.find(project => project.id === 'shinsungin');
const momu = pinnedProjects.find(project => project.id === 'momu');
const projectCluster = `<div class="cluster cluster-project" data-cluster="project" role="group" aria-label="신성인과 모무의 프로젝트 별자리"><svg class="cluster-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path/></svg>
${recordStar({ className:'node-shin', title:'신성인', period:'2023.06 — 2025.03', role:shinsungin.role.split(" · ")[0], href:'#detail-shinsungin', dataAttribute:'data-open-project="detail-shinsungin"' })}
<span class="waypoint waypoint-0" aria-hidden="true"></span><span class="waypoint waypoint-1" aria-hidden="true"></span><span class="waypoint waypoint-2" aria-hidden="true"></span><span class="waypoint waypoint-3" aria-hidden="true"></span>
${recordStar({ className:'node-momu', title:'모무', period:'2026.08', role:momu.role.split(" · ")[0], href:'#detail-momu', dataAttribute:'data-open-project="detail-momu"' })}</div>`;
const activityStar = (key, className, title) => {
  const index = records[key];
  const activity = activities[index];
  return recordStar({
    className, title, period:activity.period, role:activity.role,
    href:`#activity-${index}`, dataAttribute:'data-activity-link',
  });
};
const activityCluster = `<div class="cluster cluster-activity" data-cluster="activity" role="group" aria-label="PRON과 대학 활동의 별자리"><svg class="cluster-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path/></svg>
${activityStar('pron','node-pron','PRON')}
<span class="waypoint waypoint-0" aria-hidden="true"></span><span class="waypoint waypoint-1" aria-hidden="true"></span><span class="waypoint waypoint-2" aria-hidden="true"></span>
${activityStar('ai','node-ai','AI대학 학생회')}
${activityStar('it','node-it','IT지원위원회')}</div>`;

const featuredDetail = project => project.details.find(detail => detail.label === (project.id === 'shinsungin' ? '직접 만든 부분' : '주요 화면'))?.paragraphs || [];
const feature = project => `<article class="project-feature feature-${e(project.id === 'shinsungin' ? 'shin' : 'momu')}">
<div class="feature-copy"><p class="feature-meta">${e(project.role)}</p><h3>${e(projectTitle(project))}</h3><p class="feature-description">${e(project.summary)}</p><p class="feature-specific">${e(featuredDetail(project).join(' / '))}</p><a href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}">만든 내용 자세히 보기</a></div>
<figure class="feature-visual">${project.images.slice(0,2).map(image => `<img src="${e(image.src)}" width="${image.width}" height="${image.height}" alt="${e(image.alt)}" loading="lazy" decoding="async">`).join('')}</figure></article>`;
const archiveProject = project => `<details class="project-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.role} ${project.summary} ${project.description}`)}"><summary><span class="archive-name">${e(projectTitle(project))}</span><span class="archive-description">${e(project.description)}</span><span class="archive-role">${e(project.role)}</span><span class="archive-toggle" aria-hidden="true">+</span></summary><div class="project-detail">${project.details.map(detail => `<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(paragraph => `<p>${e(paragraph)}</p>`).join('')}</div>`).join('')}<a href="${publicSite}/projects/#${e(project.id)}">프로젝트 화면 보기</a></div></details>`;
const activityEntry = key => {
  const index = records[key];
  const activity = activities[index];
  return `<li id="activity-${index}" tabindex="-1"><span class="activity-period">${e(compactPeriod(activity.period))}</span><div><strong>${e(activity.organization)}</strong><span>${e(activity.role)}</span></div></li>`;
};
const careerEntries = careers.length
  ? `<div class="career-index"><h3>경력</h3><ul>${careers.map((career,index) => `<li id="career-${index}"><strong>${e(career.organization)}</strong><span>${e(career.role || '')} · ${e(compactPeriod(career.period))}</span></li>`).join('')}</ul></div>`
  : '';
const meteorLinks = [commitRecords[5], commitRecords[0]].map((commit,index) => `<a class="meteor meteor-${index}" href="${e(commit.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(`${commit.date} 커밋: ${commit.subject}`)}"><span class="meteor-streak" aria-hidden="true"></span><span class="meteor-copy"><strong>${e(commit.subject)}</strong><small>${e(commit.date)} · ${e(commit.shortSha)}</small></span></a>`).join('');

export function renderConcept() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#080d2c"><meta name="description" content="정지원의 작업과 활동을 두 별자리와 완만한 787의 비행으로 읽는 비교 시안."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><title>정지원 · 순항</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/cruise.css"><script type="module" src="/cruise.js"></script></head><body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>${renderConceptNavigation('cruise')}
<div class="cruise-page" id="top"><header class="site-header content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">.</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="${publicSite}/blog/">Blog</a></nav></header>
<main id="main" tabindex="-1"><div class="night-journey"><svg class="sky-dots" viewBox="0 0 1200 1800" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">${skyDots}</svg>
<div class="aircraft-overlay"><div class="aircraft-track" role="img" aria-label="밤하늘에서 완만하게 비행하는 Boeing 787 문자 그림"><div class="aircraft-stage" id="cruise-aircraft" aria-hidden="true"><p class="loading">787</p></div></div></div>
<section class="opening content-width" aria-labelledby="identity-title"><div class="sky-intro"><div class="identity"><p class="hello">안녕하세요,</p><h1 id="identity-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature" lang="en">${e(signature)}</p><p class="intro-copy">숭실대학교에서 공부하며<br>서비스를 만들고 기획합니다.</p><a class="read-cv" href="#cv">이력부터 읽기 <span aria-hidden="true">↓</span></a></div></div></section>
<section class="constellation-field" aria-labelledby="constellation-title"><h2 id="constellation-title" class="sr-only">프로젝트와 활동의 두 별자리</h2>${projectCluster}${activityCluster}</section>
<section class="meteor-stage" aria-labelledby="meteor-title"><h2 id="meteor-title" class="sr-only">공개 커밋 기록</h2><div class="meteor-field">${meteorLinks}</div></section></div>
<div class="ground"><section class="cv-section content-width" id="cv" aria-labelledby="cv-title"><div class="cv-voice"><h2 id="cv-title">CV</h2><p class="cv-lead">급식·공지·계정 정보를 모아 신성인을 만들었습니다.</p><p class="cv-story">2024년 PRON 기장을 맡았고, 지금은 AI대학 학생회에서 활동합니다. 숭실대학교 IT지원위원회에는 PM으로 참여하고 있습니다.</p><a href="${publicSite}/cv/">전체 이력 보기</a></div>
<div class="cv-facts">${careerEntries}<div class="activity-index"><h3>활동</h3><ul>${['pron','ai','it'].map(activityEntry).join('')}</ul></div><div class="cv-aside"><div><h3>학력</h3>${education.map(item => `<p>${e(item.organization)}<span>${e(compactPeriod(item.period))}</span></p>`).join('')}</div><div><h3>수상</h3>${awards.map(item => `<p>${e(item.title)}<span>${e(item.distinction)}</span></p>`).join('')}</div></div></div></section>
<section class="project-showcase content-width" id="projects" aria-labelledby="projects-title"><div class="showcase-heading"><h2 id="projects-title">만든 것</h2><p>먼저 볼 두 프로젝트</p></div>${pinnedProjects.slice(0,2).map(feature).join('')}</section>
<section class="archive-section content-width" id="all-projects" aria-labelledby="archive-title"><div class="archive-heading"><h2 id="archive-title">전체 프로젝트</h2><form class="project-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input id="project-search" type="search" name="q" placeholder="이름, 역할, 내용" maxlength="100" autocomplete="off"><button type="reset">초기화</button></form></div><p id="project-count" role="status">${projects.length}개의 프로젝트</p><div class="project-grid">${projects.map(archiveProject).join('')}</div><p id="project-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
<footer class="site-footer content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">.</span></a><p>정지원 · Jiwon Jung</p><a href="${publicSite}/blog/">블로그 읽기</a></footer></div></main></div></body></html>`;
}
