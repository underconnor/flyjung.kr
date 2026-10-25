import { renderConceptNavigation } from '../navigation.mjs';
import { escapeHTML as e } from '../../site/html.mjs';
import { projects } from '../../site/data/projects.mjs';
import { activities, awards, education } from '../../site/data/cv.mjs';

export const signature = 'Grounded, mostly.';

const planeIcon = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m4 14 24-9-8 23-5-10-11-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m15 18 13-13" stroke="currentColor" stroke-width="1.6"/></svg>`;
const fallback = `<svg class="mascot-fallback" viewBox="0 0 520 400" fill="none" aria-hidden="true"><path d="m75 244 374-108-139 206-59-109-176 11Z" fill="#eceaf4" stroke="#42396c" stroke-width="3" stroke-linejoin="round"/><path d="m251 233 198-97-139 206" stroke="#42396c" stroke-width="3" stroke-linejoin="round"/><ellipse cx="267" cy="190" rx="66" ry="45" fill="#fbfbff" stroke="#42396c" stroke-width="3"/><circle cx="311" cy="143" r="38" fill="#fbfbff" stroke="#42396c" stroke-width="3"/><path d="m342 146 35 12-37 10" fill="#f7d66a" stroke="#42396c" stroke-width="3" stroke-linejoin="round"/><circle cx="322" cy="135" r="3.5" fill="#42396c"/><path d="M234 185c8 25 40 30 54 12" stroke="#42396c" stroke-width="3" stroke-linecap="round"/></svg>`;

function projectSection(project) {
  const made = project.details.find(detail => detail.label === '직접 만든 부분');
  const decision = project.details.find(detail => detail.label === '설계 결정');
  return `<article class="project project-${e(project.id)}" id="${e(project.id)}" aria-labelledby="${e(project.id)}-title">
    <div class="project-content">
      <p class="project-role">${e(project.role)}</p>
      <h3 id="${e(project.id)}-title">${e(project.id === 'momu' ? '모무' : project.title)}</h3>
      <p class="project-summary">${e(project.summary)}</p>
      ${made ? `<ul class="project-made">${made.paragraphs.map(text => `<li>${e(text)}</li>`).join('')}</ul>` : '<p class="project-story">UNITHON에서 함께 만든 일상 미션 앱입니다.</p>'}
      ${decision ? `<p class="project-story">${e(decision.paragraphs.join(' '))}</p>` : ''}
      <a class="project-link" href="http://127.0.0.1:4319/projects/#${e(project.id)}">${e(project.id === 'momu' ? '모무' : project.title)} 자세히 보기 <span aria-hidden="true">↗</span></a>
    </div>
    <div class="project-images">${project.images.map(image => `<figure><img src="${e(image.src)}" alt="${e(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"><figcaption>${e(image.alt.replace(/^(신성인 앱의 |모무 앱의 )/, ''))}</figcaption></figure>`).join('')}</div>
  </article>`;
}

export function renderConcept() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#fbfbff">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="description" content="비행기와 오리를 담은 flyjung의 별도 포트폴리오 시안.">
  <title>flyjung — 비행기와 오리</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/flight.css">
  <script type="module" src="/flight.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  ${renderConceptNavigation('flight')}
  <header class="site-header page-width">
    <a class="wordmark" href="#top" aria-label="flyjung 처음으로">flyjung<span class="wordmark-plane">${planeIcon}</span></a>
    <nav aria-label="주요 메뉴"><a href="#work">만든 것</a><a href="#about">활동</a><a href="http://127.0.0.1:4319/blog/">Blog</a></nav>
  </header>
  <main id="main" tabindex="-1">
    <section class="hero page-width" id="top" aria-labelledby="hero-title">
      <div class="hero-name"><h1 id="hero-title" lang="en">flyjung<span>.</span></h1><p class="hero-real-name" lang="en">Jiwon Jung</p></div>
      <div class="hero-scene">
        <figure class="mascot" id="flight-mascot">
          <img src="/flight-assets/flight-duck.png" alt="종이비행기를 타고 있는 오리" width="1536" height="1024" decoding="async" data-mascot-image hidden>
          ${fallback}
        </figure>
        <p class="hero-signature" lang="en">${e(signature)}</p>
        <div class="flight-control"><button id="fly-button" type="button" aria-describedby="flight-status">${planeIcon}<span>한 바퀴 날기</span></button><p id="flight-status" role="status" aria-live="polite">잠깐, 같이 날아 볼까요?</p></div>
      </div>
      <div class="hero-intro"><p>개발하고 기획하는<br><strong>정지원입니다.</strong></p><p>만든 것과 함께한 활동,<br>그때의 생각을 남깁니다.</p><a href="#work" class="scroll-link">만든 것부터 보기 <span aria-hidden="true">↓</span></a></div>
    </section>
    <section class="work-section" id="work" aria-labelledby="work-title">
      <div class="page-width"><div class="section-intro"><h2 id="work-title">만든 것</h2><p>학교생활을 담은 신성인,<br>일상에 작은 미션을 더한 모무.</p></div>${projects.map(projectSection).join('')}</div>
    </section>
    <section class="about-section page-width" id="about" aria-labelledby="about-title">
      <div class="about-heading"><h2 id="about-title">함께한<br>활동</h2><p>숭실대학교에 다니며<br>개발과 기획을 하고 있습니다.</p><a class="quiet-link" href="http://127.0.0.1:4319/cv/">전체 이력 보기</a></div>
      <div class="about-body"><ul class="activity-list">${activities.map(entry => `<li><div><h3>${e(entry.organization)}</h3><p>${e(entry.role)}</p></div><p class="activity-period">${e(entry.period)}</p></li>`).join('')}</ul>
        <div class="about-extra"><div><h3>수상</h3>${awards.map(award => `<p>${e(award.title)}<span>${e(award.distinction)}</span></p>`).join('')}</div><div><h3>학력</h3>${education.map(entry => `<p>${e(entry.organization)}<span>${e(entry.period)}</span></p>`).join('')}</div></div>
      </div>
    </section>

  </main>
  <footer class="site-footer page-width"><a href="#top" class="footer-name">flyjung.</a><p>정지원의 웹사이트</p><a href="http://127.0.0.1:4319/">공개 사이트</a></footer>
</body>
</html>`;
}
