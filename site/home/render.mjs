import { escapeHTML as e } from '../html.mjs';
import { renderMetadata, renderSiteNameProperties, signature } from '../metadata.mjs';
import { projects } from '../data/projects.mjs';
import { activities, awards, careers, education } from '../data/cv.mjs';
import { getPublishedPosts, publishedPosts } from '../data/blog.mjs';
import { getRecentPosts, isRecentPostDate } from '../../src/scripts/recent-posts.js';
import { renderSiteHeader, renderSiteFooter } from '../chrome.mjs';
import { renderPrimaryProjectLink } from '../project-links.mjs';
import { renderProjectGallery } from '../project-gallery.mjs';

const featuredProjects = ['lms-redesign', 'passport'].map(id => {
  const project = projects.find(project => project.id === id);
  if (!project) throw new Error(`Cruise needs featured project: ${id}`);
  return project;
});
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
for (const id of ['shinsungin', 'lms-redesign', 'passport']) {
  if (!projects.some(project => project.id === id)) throw new Error(`Cruise constellation needs project: ${id}`);
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
  return `<a class="star-node ${className}" href="${e(href)}" ${dataAttribute}><span class="star-core" aria-hidden="true"></span><span class="star-label"><strong>${e(title)}</strong>${period ? `<small class="period-full">${e(compactPeriod(period))}</small><small class="period-short">${e(shortPeriod(period))}</small>` : ''}</span><span class="sr-only">${e(role)}. 상세 기록으로 이동</span></a>`;
}
const shinsungin = projects.find(project => project.id === 'shinsungin');
const lms = projects.find(project => project.id === 'lms-redesign');
const passport = projects.find(project => project.id === 'passport');
const projectCluster = `<div class="cluster cluster-project" data-cluster="project" role="group" aria-label="LMS Redesign, Passport, 신성인의 프로젝트 별자리"><svg class="cluster-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path/></svg>
${recordStar({ className:'node-shin', title:'신성인', period:'2023.06 — 2025.03', role:shinsungin.role.split(" · ")[0], href:'#detail-shinsungin', dataAttribute:'data-open-project="detail-shinsungin"' })}
<span class="waypoint waypoint-0" aria-hidden="true"></span><span class="waypoint waypoint-1" aria-hidden="true"></span><span class="waypoint waypoint-2" aria-hidden="true"></span><span class="waypoint waypoint-3" aria-hidden="true"></span>
${recordStar({ className:'node-lms', title:'LMS Redesign', period:lms.period || '', role:lms.role, href:'#detail-lms-redesign', dataAttribute:'data-open-project="detail-lms-redesign"' })}
${recordStar({ className:'node-passport', title:'Passport', period:passport.period || '', role:passport.role, href:'#detail-passport', dataAttribute:'data-open-project="detail-passport"' })}</div>`;
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

const feature = (project, index) => {
  const functions = project.details.find(detail => detail.label === '주요 기능')?.paragraphs || [];
  const contribution = project.details.find(detail => detail.label === '담당한 일') || project.details[1];
  const visual = project.images.length
    ? `<div class="feature-visual">${renderProjectGallery(project, { id: `cruise-${project.id}` })}</div>`
    : `<div class="feature-context"><p class="feature-context-label">담당한 일</p>${contribution.paragraphs.map(paragraph => `<p class="feature-context-copy">${e(paragraph)}</p>`).join('')}<p class="feature-specific">${functions.map(e).join('<br>')}</p></div>`;
  return `<article id="work-${e(project.id)}" class="project-feature${index % 2 ? ' feature-alternate' : ''}${project.images.length ? '' : ' feature-text'}"><div class="feature-copy"><p class="feature-meta"><span>${e(project.role)}</span>${project.period ? `<span class="feature-period">${e(compactPeriod(project.period))}</span>` : ''}</p><h3>${e(projectTitle(project))}</h3><p class="feature-description">${e(project.summary)}</p><p class="feature-specific">${contribution.paragraphs.map(e).join('<br>')}</p><div class="feature-actions"><a href="/projects/#${e(project.id)}" data-home-return="work-${e(project.id)}">Project details <span aria-hidden="true">↗</span></a>${renderPrimaryProjectLink(project)}</div></div>${visual}</article>`;
};
const archiveProject = project => {
  const overview = project.overview;
  if (!overview?.work || !Array.isArray(overview.stack) || !overview.stack.length) throw new Error(`Cruise needs a reviewed overview: ${project.id}`);
  return `<details class="project-row" id="detail-${e(project.id)}" data-project data-search="${e(`${project.title} ${project.role} ${project.period || ''} ${project.summary} ${project.description} ${overview.work} ${overview.stack.join(' ')}`)}"><summary><span class="archive-name">${e(projectTitle(project))}</span><span class="archive-description">${e(project.description)}</span><span class="archive-role">${e(project.role)}${project.period ? ` · ${e(compactPeriod(project.period))}` : ''}</span><span class="archive-toggle" aria-hidden="true">+</span></summary><div class="project-detail"><div><h4>Work</h4><p>${e(overview.work)}</p></div><div><h4>Stack</h4><p>${overview.stack.map(e).join(' · ')}</p></div><a class="project-details-link" href="/projects/#${e(project.id)}" data-home-return="detail-${e(project.id)}">Project details <span aria-hidden="true">→</span></a></div></details>`;
};
const summaryActivities = activities.map((activity, index) => `<li id="activity-${index}" tabindex="-1"><span class="activity-period">${e(compactPeriod(activity.period))}</span><div><strong>${e(activity.organization)}</strong>${activity.role ? `<span>${e(activity.role)}</span>` : ''}</div></li>`).join('');
const summaryEducation = education.map(item => `<li><span class="activity-period">${e(compactPeriod(item.period))}</span><div><strong>${e(item.organization)}</strong>${item.department ? `<span>${e(item.department)}</span>` : ''}</div></li>`).join('');
const summaryAwards = awards.map(award => `<li><span class="activity-period">${e(award.period || '')}</span><div><strong>${e(award.title)}${award.subtitle ? `<br><span class="award-subtitle">${e(award.subtitle)}</span>` : ''}</strong><span>${e(award.distinction)}</span></div></li>`).join('');
const careerEntries = careers.length
  ? `<div class="career-index"><h3>경력</h3><ul>${careers.map((career,index) => `<li id="career-${index}"><strong>${e(career.organization)}</strong><span>${e(career.role || '')} · ${e(compactPeriod(career.period))}</span></li>`).join('')}</ul></div>`
  : '';
export function renderHome({ publicBuild = false, posts = publishedPosts, now = new Date() } = {}) {
  const candidates = getPublishedPosts(posts);
  const recentCount = getRecentPosts(candidates, now).length;
  const meteorLinks = candidates.map((post, index) => `<a class="meteor" data-post-date="${e(post.date)}" data-meteor-lane="${index % 2}" href="/blog/${e(post.slug)}/"${isRecentPostDate(post.date, now) ? '' : ' hidden'}><span class="meteor-streak" aria-hidden="true"></span><span class="meteor-copy"><strong>${e(post.title)}</strong><small><time datetime="${e(post.date)}">${e(post.date.replaceAll('-', '.'))}</time></small></span></a>`).join('');

  const facts = `${careerEntries}<div class="activity-index awards-index"><h3>Awards</h3><ul>${summaryAwards}</ul></div><div class="cv-aside"><div class="activity-index experience-index"><h3>Experience</h3><ul>${summaryActivities}</ul></div><div class="activity-index education-index"><h3>Education</h3><ul>${summaryEducation}</ul></div></div><a class="full-cv-link" href="/cv/">View full CV <span aria-hidden="true">↗</span></a>`;
  const cv = `<section class="cv-section cv-split content-width" id="cv" aria-labelledby="cv-title"><div class="cv-heading"><h2 id="cv-title">CV</h2></div><div class="cv-facts">${facts}</div></section>`;
  const metadata = renderMetadata();
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${publicBuild ? 'index,follow' : 'noindex,nofollow'}"><meta name="theme-color" content="#080d2c"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">${metadata}<link rel="icon" href="/assets/favicon.svg?v=jiwon-dot-20261109" type="image/svg+xml"><link rel="stylesheet" href="/cruise.css">
<link rel="modulepreload" href="/cruise.js">
<link rel="modulepreload" href="/scripts/recent-posts.js">
<link rel="modulepreload" href="/scripts/project-gallery.js">
<link rel="modulepreload" href="/sky-engine/viewer.mjs" fetchpriority="low">
<link rel="modulepreload" href="/aircraft-v2/model.mjs" fetchpriority="low">
<script src="/scripts/page-flow.js"></script><script type="module" src="/cruise.js" blocking="render"></script></head><body>
<a class="skip-link" href="#main">본문으로 건너뛰기</a>
<div class="cruise-page" id="top" itemscope itemtype="https://schema.org/WebSite">${renderSiteNameProperties()}${renderSiteHeader({page:"home",widthClass:"content-width"})}
<main id="main" tabindex="-1"><div class="night-journey"><svg class="sky-dots" viewBox="0 0 1200 1800" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">${skyDots}</svg>
<div class="aircraft-overlay"><div class="aircraft-track" role="img" aria-label="밤하늘에서 완만하게 비행하는 Boeing 787 문자 그림"><div class="aircraft-stage" id="cruise-aircraft" aria-hidden="true"><p class="loading">787</p></div></div></div>
<section class="opening content-width" aria-labelledby="identity-title"><div class="sky-intro"><div class="identity"><p class="greeting" lang="la">${e(signature)}</p><h1 id="identity-title">정지원<span lang="en">Jiwon Jung</span></h1><p class="signature">숭실대학교 AI소프트웨어학부 1학년</p><a class="read-cv" href="#cv">Explore CV <span aria-hidden="true">↓</span></a></div></div></section>
<section class="constellation-field" aria-labelledby="constellation-title"><h2 id="constellation-title" class="sr-only">프로젝트와 활동의 두 별자리</h2>${projectCluster}${activityCluster}</section>
<section class="meteor-stage" data-recent-count="${recentCount}" aria-labelledby="meteor-title"><h2 id="meteor-title" class="sr-only">Recent Blog posts</h2><div class="meteor-field" data-recent-count="${recentCount}">${meteorLinks}</div></section></div>
<div class="ground">${cv}
<section class="project-showcase content-width" id="projects" aria-labelledby="projects-title"><div class="showcase-heading"><h2 id="projects-title">Selected Work</h2></div>${featuredProjects.map((project, index) => feature(project, index)).join('')}</section>
<section class="archive-section content-width" id="all-projects" aria-labelledby="archive-title"><div class="archive-heading"><h2 id="archive-title">All Projects</h2><form class="project-search" role="search" hidden><label for="project-search">Search</label><input id="project-search" type="search" name="q" placeholder="Name, role, keyword" maxlength="100" autocomplete="off"><button type="reset">Reset</button></form></div><p id="project-count" role="status">${projects.length} projects</p><div class="project-grid">${projects.map(project => archiveProject(project)).join('')}</div><p id="project-empty" hidden>No projects found. Try another keyword.</p></section>
${renderSiteFooter({page:"home",widthClass:"content-width"})}</div></main></div></body></html>`;
}
