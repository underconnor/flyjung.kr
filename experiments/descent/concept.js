const searchForm=document.querySelector('.project-search');
const search=document.querySelector('#project-search');
const rows=[...document.querySelectorAll('[data-project]')];
const count=document.querySelector('#project-count');
const empty=document.querySelector('#project-empty');
const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim();
function filter(updateURL=true){
  const terms=normalize(search.value).split(/\s+/).filter(Boolean);let visible=0;
  for(const row of rows){const haystack=normalize(row.dataset.search);row.hidden=!terms.every(term=>haystack.includes(term));if(!row.hidden)visible++;}
  count.textContent=`${visible}개 프로젝트`;empty.hidden=visible!==0;
  if(updateURL){const url=new URL(location.href);search.value.trim()?url.searchParams.set('q',search.value.trim()):url.searchParams.delete('q');history.replaceState(null,'',url);}
}
searchForm.hidden=false;search.value=new URL(location.href).searchParams.get('q')||'';filter(false);
search.addEventListener('input',()=>filter());
searchForm.addEventListener('submit',event=>{event.preventDefault();filter();});
searchForm.addEventListener('reset',event=>{event.preventDefault();search.value='';filter();search.focus();});
function revealHash(){const target=rows.find(row=>`#${row.id}`===location.hash);if(target&&!target.hidden)target.open=true;}
for(const link of document.querySelectorAll('[data-project-link]'))link.addEventListener('click',event=>{
  const target=document.getElementById(link.dataset.projectLink);if(!target)return;
  event.preventDefault();if(target.hidden){search.value='';filter();}target.open=true;
  if(location.hash!==link.hash)history.pushState(null,'',link.hash);
  target.querySelector('summary').focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});
});
window.addEventListener('hashchange',revealHash);
window.addEventListener('popstate',()=>{search.value=new URL(location.href).searchParams.get('q')||'';filter(false);revealHash();});revealHash();
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();document.querySelector('#main').focus();});

const host=document.querySelector('#descent-aircraft');
const voyage=document.querySelector('.voyage');
const sky=document.querySelector('.star-field');
const journey=document.querySelector('.sky-journey');
const aircraftTrack=document.querySelector('.aircraft-track');
const buttons=[...document.querySelectorAll('.mode-control button')];
const motionButton=document.querySelector('#scroll-motion');
const status=document.querySelector('#aircraft-status');
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
let viewer,frame=0,visible=true,motionEnabled=true,destroyed=false;
const scrollProgress=()=>Math.min(1,Math.max(0,-voyage.getBoundingClientRect().top/(voyage.clientHeight*.9)));
function applyScroll(){
  frame=0;if(destroyed||!visible||document.hidden)return;
  const progress=scrollProgress();
  const skyBounds=journey.getBoundingClientRect(),planeBounds=host.getBoundingClientRect();
  aircraftTrack.classList.toggle('lower-sky',(planeBounds.bottom+30-skyBounds.top)/skyBounds.height>.74);
  aircraftTrack.classList.toggle('low-aircraft',(planeBounds.top+planeBounds.height*.6-skyBounds.top)/skyBounds.height>.78);
  if(!motionEnabled||media.matches){sky.style.transform='';return;}
  sky.style.transform=`translateY(${Math.round(progress*42)}px)`;
  viewer?.setOrientation?.({azimuth:.52+progress*.22,elevation:.62-progress*.14,roll:Math.sin(progress*Math.PI)*.09,immediate:true,preserveInput:true});
}
function schedule(){if(!frame&&!destroyed&&!document.hidden&&visible)frame=requestAnimationFrame(applyScroll);}
function syncMotion(){
  const active=motionEnabled&&!media.matches;
  if(media.matches){aircraftTrack.classList.remove('lower-sky');aircraftTrack.classList.remove('low-aircraft');}
  document.body.classList.toggle('motion-off',!active);
  motionButton.setAttribute('aria-pressed',String(active));
  motionButton.textContent=media.matches?'움직임 줄이기 적용':motionEnabled?'스크롤 반응 켜짐':'스크롤 반응 꺼짐';
  motionButton.disabled=media.matches;
  if(!active){if(frame){cancelAnimationFrame(frame);frame=0;}sky.style.transform='';viewer?.setOrientation?.({azimuth:.52,elevation:.62,roll:0,immediate:true,preserveInput:true});}
  else schedule();
}
function syncViewer(){
  const ready=host.dataset.ready==='true';
  for(const button of buttons){button.disabled=!ready;button.setAttribute('aria-pressed',String(button.dataset.mode===host.dataset.mode));}
  const next=host.dataset.ready==='false'?'비행기를 불러오지 못했습니다. 기록과 프로젝트는 계속 볼 수 있습니다.':host.dataset.renderer==='ascii-fallback'?'입체 가속을 사용할 수 없어 문자로 표시합니다.':'';
  if(status.textContent!==next)status.textContent=next;
}
host.addEventListener('skyviewerchange',syncViewer);
for(const button of buttons)button.addEventListener('click',()=>viewer?.setMode(button.dataset.mode));
motionButton.addEventListener('click',()=>{motionEnabled=!motionEnabled;syncMotion();});
media.addEventListener('change',syncMotion);
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();});
const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();},{rootMargin:'150px'});observer.observe(voyage);
try{
  const {createSkyViewer}=await import('/sky-engine/viewer.mjs');host.replaceChildren();viewer=createSkyViewer(host,{mode:'ascii',interactive:true});
  viewer.setInputOptions?.({drag:true,scroll:false,pointer:false});syncViewer();syncMotion();
}catch{host.dataset.ready='false';host.textContent='좋아하는 비행기, 787';syncViewer();}
window.addEventListener('pagehide',event=>{if(event.persisted)return;destroyed=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);viewer?.destroy();});
window.addEventListener('pageshow',event=>{if(event.persisted)schedule();});
