import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { careers, activities, awards, education, cvIdentity } from '../../site/data/cv.mjs';
import { renderConceptNavigation } from '../navigation.mjs';

const publicSite = 'http://127.0.0.1:4319';
const projectName = project => project.id === 'momu' ? '모무' : project.title;
const activityId = (activity, index) => activity.organization.includes('IT지원위원회') ? 'activity-it' : activity.organization.includes('PRON') ? 'activity-pron' : `activity-${index}`;
const graphProject = id => {
  const project = projects.find(item => item.id === id);
  return project && { id, title: projectName(project), role: project.role.split(' · ')[0], description: `${project.summary} ${project.role}`, href: `#detail-${id}`, project: true };
};
const graphActivity = (id, organization) => {
  const index = activities.findIndex(item => item.organization.includes(organization));
  const activity = activities[index];
  return activity && { id, title: id === 'pron' ? 'PRON' : 'IT지원위원회', role: activity.role, description: `${activity.organization} · ${activity.role} · ${activity.period}`, href: `#${activityId(activity,index)}` };
};
const graphNodes = [graphProject('shinsungin'), graphProject('momu'), graphActivity('pron','PRON'), graphActivity('it','IT지원위원회')].filter(Boolean);
const graphNode = node => `<a class="graph-node graph-node-${e(node.id)}" data-graph-node="${e(node.id)}" data-description="${e(node.description)}" href="${e(node.href)}"${node.project?` data-open-project="detail-${e(node.id)}"`:''}><span class="node-star" aria-hidden="true">${node.project?'*':'+'}</span><span class="node-copy"><strong>${e(node.title)}</strong><span>${e(node.role)}</span></span></a>`;
const cvRows = (entries, group = 'activity') => `<ul class="cv-list">${entries.map((entry,index)=>`<li id="${group === 'activity' ? activityId(entry,index) : `${group}-${index}`}" tabindex="-1"><div><h3>${e(entry.organization)}</h3><p>${e(entry.role)}</p></div><p class="cv-period">${e(entry.period)}</p></li>`).join('')}</ul>`;
const pinned = project => `<article class="pinned-project" id="project-${e(project.id)}" tabindex="-1"><div class="pinned-copy"><p class="project-role">${e(project.role)}</p><h3>${e(projectName(project))}</h3><p class="project-summary">${e(project.summary)}</p><a class="text-link" href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}">어떻게 만들었는지 <span aria-hidden="true">↗</span></a></div><figure><img src="${e(project.images[0].src)}" alt="${e(project.images[0].alt)}" width="${project.images[0].width}" height="${project.images[0].height}" loading="lazy" decoding="async"></figure></article>`;
const catalogRow = project => `<details class="catalog-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.summary} ${project.role} ${project.meta}`)}"><summary><span class="catalog-title">${e(projectName(project))}</span><span class="catalog-summary">${e(project.summary)}</span><span class="catalog-role">${e(project.role)}</span><span class="catalog-toggle" aria-hidden="true">+</span></summary><div class="catalog-detail">${project.details.map(detail=>`<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(p=>`<p>${e(p)}</p>`).join('')}</div>`).join('')}<a class="text-link" href="${publicSite}/projects/#${e(project.id)}">프로젝트 화면 보기 <span aria-hidden="true">↗</span></a></div></details>`;

export function renderConcept() {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#090f35"><meta name="description" content="정지원의 프로젝트와 활동, 그리고 좋아하는 것들."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><title>정지원 · flyjung — Horizon</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/horizon.css"><script type="module" src="/horizon.js"></script></head>
<body><a href="#main" class="skip-link">본문으로 건너뛰기</a>
${renderConceptNavigation('horizon')}
<header class="site-header page-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">*</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="${publicSite}/blog/">Blog</a></nav></header>
<main id="main" tabindex="-1">
  <section class="hero page-width" id="top" aria-labelledby="hero-title">
    <canvas id="ascii-stars" aria-hidden="true"></canvas>
    <div class="hero-intro"><p class="hello">안녕하세요,</p><h1 id="hero-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature" lang="en">${e(signature)}</p><p class="intro-copy">숭실대학교에서 공부하며<br>서비스를 만들고 기획합니다.</p>
      <section class="aircraft" aria-labelledby="aircraft-title"><div class="aircraft-heading"><h2 id="aircraft-title">좋아하는 비행기, <span lang="en">787</span></h2><p id="aircraft-help">드래그 · 방향키로 돌려 보기</p></div><div class="aircraft-stage" id="horizon-aircraft" aria-label="787을 참고한 비행기 모형" aria-describedby="aircraft-help"><p class="aircraft-loading">787 모델을 불러오고 있습니다.</p></div><div class="aircraft-controls" hidden><div class="mode-control" aria-label="비행기 표현"><button type="button" data-mode="ascii" aria-pressed="true">문자</button><button type="button" data-mode="solid" aria-pressed="false">입체</button></div><div class="aircraft-actions"><a href="/flight-lab/">비행기 실험실</a><button type="button" id="reset-aircraft">처음 각도 <span aria-hidden="true">↶</span></button></div></div><p class="sr-only" id="aircraft-status" role="status"></p></section>
    </div>
    <section class="constellation" aria-labelledby="constellation-title"><div class="constellation-heading"><h2 id="constellation-title">프로젝트와 활동</h2><p class="graph-legend"><span><b aria-hidden="true">*</b> 프로젝트</span><span><b aria-hidden="true">+</b> 활동</span></p></div><div class="sky-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${graphNodes.map(node=>`<line data-graph-edge="${e(node.id)}"/>`).join('')}</svg><div class="graph-hub"><span class="node-star" aria-hidden="true">*</span><span>flyjung</span></div>${graphNodes.map(graphNode).join('')}</div><div class="graph-footer"><p id="graph-caption" class="graph-caption" aria-live="polite">직접 만들거나 함께한 일들입니다.</p></div></section>
  </section>
  <div class="daylight">
    <section class="cv-section page-width" id="cv" aria-labelledby="cv-title"><div class="section-heading"><h2 id="cv-title">CV</h2><p>${e(cvIdentity)}</p><a class="text-link" href="${publicSite}/cv/">전체 이력 보기 <span aria-hidden="true">↗</span></a></div><div class="cv-content">${careers.length?`<div class="cv-group"><h3 class="group-title">경력</h3>${cvRows(careers, 'career')}</div>`:''}<div class="cv-group"><h3 class="group-title">활동</h3>${cvRows(activities)}</div><div class="cv-extra"><div><h3 class="group-title">수상</h3>${awards.map(award=>`<p>${e(award.title)}<span>${e(award.distinction)}</span></p>`).join('')}</div><div><h3 class="group-title">학력</h3>${education.map(entry=>`<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div></div></div></section>
    <section class="projects-section page-width" id="projects" aria-labelledby="projects-title"><div class="section-top"><h2 id="projects-title">먼저 볼 프로젝트</h2><a href="#all-projects">전체 목록 <span aria-hidden="true">↓</span></a></div><div class="pinned-grid">${pinnedProjects.slice(0,2).map(pinned).join('')}</div></section>
    <section class="catalog-section page-width" id="all-projects" aria-labelledby="catalog-title"><div class="catalog-heading"><h2 id="catalog-title">전체 프로젝트</h2><form class="catalog-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input type="search" id="project-search" name="q" placeholder="이름, 역할, 내용" autocomplete="off" maxlength="100"><button type="reset">초기화</button></form></div><p id="catalog-count" class="catalog-count" role="status">${projects.length}개의 프로젝트</p><div class="catalog-list">${projects.map(catalogRow).join('')}</div><p id="catalog-empty" class="catalog-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
    <footer class="site-footer page-width"><a href="#top">flyjung</a><p>정지원 · Jiwon Jung</p><a href="#top">처음으로 ↑</a></footer>
  </div>
</main></body></html>`;
}
