const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const search=document.querySelector('#daybreak-search');
const resetSearch=document.querySelector('#daybreak-search-reset');
const rows=[...document.querySelectorAll('#daybreak-project-list > li')];
function filterProjects(){
  const query=search.value.trim().toLocaleLowerCase();let count=0;
  for(const row of rows){row.hidden=!row.textContent.toLocaleLowerCase().includes(query);if(!row.hidden)count++;}
  document.querySelector('#daybreak-search-count').textContent=`${count}개 프로젝트`;
  document.querySelector('#daybreak-search-empty').hidden=count!==0;
  resetSearch.hidden=!search.value;
}
search.addEventListener('input',filterProjects);
resetSearch.addEventListener('click',()=>{search.value='';filterProjects();search.focus();});
function setFragment(hash){if(location.hash!==hash)history.pushState(null,'',hash);}
function revealFragment(){
  const target=document.getElementById(location.hash.slice(1));
  if(target?.tagName==='DETAILS')target.open=true;
}
for(const link of document.querySelectorAll('[data-open-project]'))link.addEventListener('click',event=>{
  const target=document.getElementById(link.dataset.openProject);
  if(!target||target.tagName!=='DETAILS')return;
  event.preventDefault();target.open=true;setFragment(link.hash);
  target.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
  target.querySelector('summary').focus({preventScroll:true});
});
for(const link of document.querySelectorAll('.work-map a:not([data-open-project])'))link.addEventListener('click',event=>{
  const target=document.getElementById(link.hash.slice(1));if(!target)return;
  event.preventDefault();setFragment(link.hash);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'center'});
});
revealFragment();
window.addEventListener('hashchange',revealFragment);
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('#main');main.focus();main.scrollIntoView({behavior:'instant'});});

const host=document.querySelector('#daybreak-aircraft');
const status=document.querySelector('#aircraft-status');
const modeButtons=[...document.querySelectorAll('[data-aircraft-mode]')];
const viewButtons=[...document.querySelectorAll('[data-aircraft-view]')];
const resetView=document.querySelector('#aircraft-reset');
let viewer;
function syncViewer(){
  const ready=host.dataset.ready==='true';
  for(const button of [...modeButtons,...viewButtons,resetView])button.disabled=!ready;
  for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.aircraftMode===host.dataset.mode));
  for(const button of viewButtons)button.setAttribute('aria-pressed',String(button.dataset.aircraftView===host.dataset.view));
  status.textContent=host.dataset.ready==='false'?'그래픽을 불러오지 못했습니다. 다른 기록은 계속 볼 수 있습니다.':ready?'':'그래픽을 불러오는 중입니다.';
}
host.addEventListener('skyviewerchange',syncViewer);
const observer=new MutationObserver(syncViewer);observer.observe(host,{attributes:true,attributeFilter:['data-ready','data-mode','data-view']});
for(const button of modeButtons)button.addEventListener('click',()=>{viewer?.setMode(button.dataset.aircraftMode);syncViewer();});
for(const button of viewButtons)button.addEventListener('click',()=>{viewer?.setView(button.dataset.aircraftView);syncViewer();});
resetView.addEventListener('click',()=>{viewer?.reset();syncViewer();});
try{
  const {createSkyViewer}=await import('/sky-engine/viewer.mjs');
  viewer=createSkyViewer(host,{mode:'ascii',interactive:true});syncViewer();
}catch{
  host.dataset.ready='false';host.textContent='Boeing 787';syncViewer();
}
window.addEventListener('pagehide',event=>{if(!event.persisted){observer.disconnect();viewer?.destroy();}});
