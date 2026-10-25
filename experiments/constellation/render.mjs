import { escapeHTML as e } from '../../site/html.mjs';
import { projects, pinnedProjects, signature } from '../catalog.mjs';
import { careers, activities, awards, education, cvIdentity } from '../../site/data/cv.mjs';
import { renderConceptNavigation } from '../navigation.mjs';

const publicSite = 'http://127.0.0.1:4319';
const projectTitle = project => project.id === 'momu' ? '모무' : project.title;
const cvRows = (rows, kind) => `<ul class="cv-rows">${rows.map((row,index)=>`<li id="${kind}-${index}" tabindex="-1"><div><h3>${e(row.organization)}</h3><p>${e(row.role || '')}</p></div><span>${e(row.period)}</span></li>`).join('')}</ul>`;
const projectDetail = project => `<details class="project-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.role} ${project.summary}`)}"><summary><span class="row-name">${e(projectTitle(project))}</span><span class="row-description">${e(project.summary)}</span><span class="row-role">${e(project.role)}</span><span class="row-toggle" aria-hidden="true">+</span></summary><div class="project-detail">${project.details.map(detail=>`<div><h4>${e(detail.label)}</h4>${detail.paragraphs.map(paragraph=>`<p>${e(paragraph)}</p>`).join('')}</div>`).join('')}<a href="${publicSite}/projects/#${e(project.id)}">프로젝트 화면 보기</a></div></details>`;
const ambientDots = Array.from({length:64}, (_, index) => {
  const x = (index * 613 + 73) % 1200;
  const y = (index * 349 + 117) % 800;
  const radius = index % 13 === 0 ? 1.7 : index % 3 === 0 ? 1.2 : .8;
  return `<circle cx="${x}" cy="${y}" r="${radius}"/>`;
}).join('');
const projectById = id => {
  const project = pinnedProjects.find(item => item.id === id);
  if (!project) throw new Error(`Missing chart project: ${id}`);
  return project;
};
const activityByOrganization = organization => {
  const index = activities.findIndex(item => item.organization === organization);
  if (index < 0) throw new Error(`Missing chart activity: ${organization}`);
  return { entry: activities[index], index };
};
const startDate = text => {
  const date = text.match(/(?:19|20)\d{2}(?:\.\d{2})?/)?.[0];
  if (!date) throw new Error(`Missing chart date: ${text}`);
  return date;
};
const shinsungin = projectById('shinsungin');
const momu = projectById('momu');
const pron = activityByOrganization('프로그래밍 동아리 PRON');
const council = activityByOrganization('AI대학 학생회');
const itCommittee = activityByOrganization('숭실대학교 IT지원위원회');
// Two loose year clusters. Relative position within a year conveys no order.
// Every bright, labelled point is a verified record; smaller dots are scenery.
const chartRecords = [
  { id: 'shinsungin', short: '신성인', full: projectTitle(shinsungin), role: shinsungin.role.split(' · ')[0], date: startDate(shinsungin.role), year: '2023', kind: 'project', href: '#detail-shinsungin' },
  { id: 'pron', short: 'PRON', full: pron.entry.organization, role: pron.entry.role, date: startDate(pron.entry.period), year: '2023', kind: 'activity', href: `#activity-${pron.index}` },
  { id: 'council', short: 'AI대학 학생회', full: council.entry.organization, role: council.entry.role, date: startDate(council.entry.period), year: '2026', kind: 'activity', href: `#activity-${council.index}` },
  { id: 'momu', short: '모무', full: projectTitle(momu), role: momu.role.split(' · ')[0], date: startDate(momu.role), year: '2026', kind: 'project', href: '#detail-momu' },
  { id: 'it', short: 'IT지원위원회', full: itCommittee.entry.organization, role: itCommittee.entry.role, date: startDate(itCommittee.entry.period), year: '2026', kind: 'activity', href: `#activity-${itCommittee.index}` },
];
for (const record of chartRecords) {
  if (!record.full || !record.role || !record.date.startsWith(record.year)) throw new Error(`Review chart record: ${record.id}`);
}
const chartAttributes = record => record.kind === 'project' ? ` data-open-project="detail-${e(record.id)}"` : ' data-activity-link';
const chartStar = record => `<a class="chart-star chart-star-${e(record.id)}" href="${e(record.href)}"${chartAttributes(record)}><span class="chart-dot" aria-hidden="true"></span><span class="chart-star-copy"><strong>${e(record.short)}</strong><small>${e(record.date)} · ${e(record.role)}</small></span><span class="sr-only">${e(record.full)}</span></a>`;
const fieldCenters = [[135,342],[325,140],[555,306],[745,120],[850,414]];
let fieldSeed = 0x7872026;
const fieldRandom = () => {
  fieldSeed += 0x6D2B79F5;
  let value = fieldSeed;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};
const fieldDots = Array.from({length:70}, (_, index) => {
  const center = fieldCenters[index % fieldCenters.length];
  const x = Math.round(index < 55 ? center[0] + fieldRandom() * 180 - 90 : fieldRandom() * 1000);
  const y = Math.round(index < 55 ? center[1] + fieldRandom() * 140 - 70 : fieldRandom() * 600);
  const radius = index % 17 === 0 ? 2 : index % 5 === 0 ? 1.35 : .8;
  return `<circle cx="${x}" cy="${y}" r="${radius}"/>`;
}).join('');

export function renderConcept() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#090f35"><meta name="description" content="정지원의 기록을 연도와 분야에 따라 읽는 별 지도, 그리고 787."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><title>정지원 · 별과 787</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/constellation.css"><script type="module" src="/constellation.js"></script></head><body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>${renderConceptNavigation('constellation')}
<div class="atmosphere-sky" id="top">
  <svg class="dot-field" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${ambientDots}</svg>
  <header class="site-header content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">*</span></a><nav aria-label="주 메뉴"><a href="#cv">CV</a><a href="#projects">Projects</a><a href="${publicSite}/blog/">Blog</a></nav></header>
  <main id="main" tabindex="-1">
    <section class="sky-intro content-width" aria-labelledby="identity-title">
      <div class="identity"><p class="hello">안녕하세요,</p><h1 id="identity-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature" lang="en">${e(signature)}</p><p class="intro-copy">숭실대학교에서 공부하며<br>서비스를 만들고 기획합니다.</p><a class="read-cv" href="#cv">이력부터 읽기 <span aria-hidden="true">↓</span></a></div>
      <div class="open-sky"><div class="aircraft" role="img" aria-label="Boeing 787을 참고해 문자로 그린 비행기"><div id="atmosphere-aircraft" class="aircraft-stage" aria-hidden="true"><p class="loading">787을 불러오는 중입니다.</p></div></div></div>
    </section>
    <section class="star-map-section" id="star-map" aria-labelledby="star-map-title"><div class="chart-heading content-width"><p class="chart-kicker">2023—2026</p><h2 id="star-map-title">만든 것과 함께한 일</h2></div>
      <div class="record-sky content-width" role="group" aria-label="프로젝트와 활동의 다섯 별"><svg class="record-dust" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fieldDots}</svg>${chartRecords.map(chartStar).join('')}</div>
    </section>
    <div class="air-depth content-width" aria-hidden="true"></div>
    <div class="ground">
      <section class="cv-section content-width" id="cv" aria-labelledby="cv-title"><div class="section-title"><h2 id="cv-title">CV</h2><p>${e(cvIdentity)}</p><a href="${publicSite}/cv/">전체 이력 보기</a></div><div class="cv-content">${careers.length?`<div class="cv-group"><h3 class="group-title">경력</h3>${cvRows(careers,'career')}</div>`:''}<div class="cv-group"><h3 class="group-title">활동</h3>${cvRows(activities,'activity')}</div><div class="cv-small"><div><h3 class="group-title">학력</h3>${education.map(entry=>`<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div><div><h3 class="group-title">수상</h3>${awards.map(award=>`<p>${e(award.title)}<span>${e(award.distinction)}</span></p>`).join('')}</div></div></div></section>
      <section class="featured-section content-width" id="projects" aria-labelledby="projects-title"><div class="section-top"><h2 id="projects-title">먼저 볼 프로젝트</h2><a href="#all-projects">전체 목록</a></div><div class="featured-projects">${pinnedProjects.slice(0,2).map(project=>`<article class="featured-project"><div><p class="project-role">${e(project.role)}</p><h3>${e(projectTitle(project))}</h3><p class="project-summary">${e(project.summary)}</p><a href="#detail-${e(project.id)}" data-open-project="detail-${e(project.id)}">만든 과정 보기</a></div><figure><img src="${e(project.images[0].src)}" width="${project.images[0].width}" height="${project.images[0].height}" alt="${e(project.images[0].alt)}" loading="lazy" decoding="async"></figure></article>`).join('')}</div></section>
      <section class="catalog-section content-width" id="all-projects" aria-labelledby="catalog-title"><div class="section-top"><h2 id="catalog-title">전체 프로젝트</h2><form class="project-search" role="search" hidden><label for="project-search">프로젝트 찾기</label><input id="project-search" type="search" name="q" placeholder="이름, 역할, 내용" maxlength="100" autocomplete="off"><button type="reset">초기화</button></form></div><p id="project-count" role="status">${projects.length}개의 프로젝트</p>${projects.map(projectDetail).join('')}<p id="project-empty" hidden>찾는 프로젝트가 없습니다. 다른 검색어로 찾아보세요.</p></section>
      <footer class="site-footer content-width"><a class="wordmark" href="#top">flyjung<span aria-hidden="true">*</span></a><p>정지원 · Jiwon Jung</p><a href="${publicSite}/blog/">블로그 읽기</a></footer>
    </div>
  </main>
</div></body></html>`;
}
