import { duckConstellation } from '/duck/constellation.mjs';

const canvas = document.querySelector('#night-sky');
const context = canvas.getContext('2d');
const hero = document.querySelector('.hero');
const connections = document.querySelector('#connect-stars');
const caption = document.querySelector('#sky-caption');
const duckButton = document.querySelector('#find-duck');
const navigation = document.querySelector('.star-navigation');
const links = [...document.querySelectorAll('[data-star]')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let linked = true, active = '', width = 0, height = 0, pending = 0;
const pointer = {x:0,y:0};
let duckVisible = false;
let seed = 787;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const stars = Array.from({length:160},()=>({x:random(),y:random(),radius:.45+random()*1.15,alpha:.18+random()*.58,depth:.3+random()*.7}));

function render() {
  pending = 0;
  if (!context || !width || !height) return;
  const ratio = Math.min(devicePixelRatio || 1,2);
  context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);
  for(const star of stars){
    const x=star.x*width+pointer.x*star.depth, y=star.y*height+pointer.y*star.depth;
    const shade = x < width*.55 && y < height*.65 ? .35 : 1;
    context.beginPath();context.arc(x,y,star.radius,0,Math.PI*2);context.fillStyle=`rgba(198,204,255,${star.alpha*shade})`;context.fill();
  }
  const bounds = hero.getBoundingClientRect();
  if (duckVisible) {
    const area = navigation.getBoundingClientRect();
    const w = area.width * .94, h = w * .75;
    const left = area.left - bounds.left + (area.width - w) / 2;
    const top = area.top - bounds.top + (area.height - h) / 2;
    const points = duckConstellation.points.map(point => ({x:left+point.x*w,y:top+point.y*h,r:(point.r||1)*1.8}));
    if (linked) {
      context.strokeStyle='rgba(170,187,255,.68)';context.lineWidth=1;
      context.beginPath();
      for(const [a,b] of duckConstellation.edges){context.moveTo(points[a].x,points[a].y);context.lineTo(points[b].x,points[b].y);}
      context.stroke();
    }
    for(const point of points){context.beginPath();context.arc(point.x,point.y,point.r,0,Math.PI*2);context.fillStyle='#d9e1ff';context.fill();}
    return;
  }
  const nodes = links.map(link=>{const point=link.querySelector('.star-point').getBoundingClientRect();return {x:point.x+point.width/2-bounds.x,y:point.y+point.height/2-bounds.y,key:link.dataset.star};});
  const satellites = nodes.map((node,index)=>[{x:node.x-48,y:node.y-32},{x:node.x-86,y:node.y+28},{x:node.x-42,y:node.y+61+(index*6)}]);
  nodes.forEach((node,index)=>{
    const lit = linked || active===node.key;
    const points=[node,...satellites[index]];
    if(lit){context.beginPath();context.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))context.lineTo(p.x,p.y);context.strokeStyle='rgba(144,161,239,.6)';context.lineWidth=1;context.stroke();}
    for(const p of points.slice(1)){context.beginPath();context.arc(p.x,p.y,lit?2:1.4,0,Math.PI*2);context.fillStyle=lit?'#d9deff':'rgba(173,185,247,.65)';context.fill();}
  });
  if(linked&&nodes.length===3){context.beginPath();context.moveTo(nodes[0].x,nodes[0].y);context.lineTo(nodes[1].x,nodes[1].y);context.lineTo(nodes[2].x,nodes[2].y);context.strokeStyle='rgba(113,134,222,.25)';context.setLineDash([2,7]);context.stroke();context.setLineDash([]);}
}
function requestRender(){if(!pending)pending=requestAnimationFrame(render);}
function resize(){const box=hero.getBoundingClientRect();width=box.width;height=box.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);requestRender();}
if(context){
  connections.hidden=false;
  duckButton.hidden=false;
  new ResizeObserver(resize).observe(hero);resize();
  hero.addEventListener('pointermove',event=>{if(motion.matches||event.pointerType==='touch')return;const box=hero.getBoundingClientRect();pointer.x=(event.clientX-box.x-box.width/2)/box.width*12;pointer.y=(event.clientY-box.y-box.height/2)/box.height*12;requestRender();});
  hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;active='';requestRender();});
  const describeSky=()=>{caption.textContent=duckVisible?'별 사이에 오리 한 마리.':linked?'CV, 프로젝트, 블로그를 별로 이었습니다.':'별을 따라 둘러보세요.';};
  connections.addEventListener('click',()=>{linked=!linked;connections.setAttribute('aria-pressed',String(linked));describeSky();requestRender();});
  duckButton.addEventListener('click',()=>{duckVisible=!duckVisible;active='';duckButton.setAttribute('aria-pressed',String(duckVisible));navigation.classList.toggle('showing-duck',duckVisible);navigation.inert=duckVisible;navigation.setAttribute('aria-hidden',String(duckVisible));describeSky();requestRender();});
  for(const link of links){for(const event of ['pointerenter','focus'])link.addEventListener(event,()=>{active=link.dataset.star;requestRender();});for(const event of ['pointerleave','blur'])link.addEventListener(event,()=>{active='';requestRender();});}
  motion.addEventListener('change',()=>{pointer.x=pointer.y=0;requestRender();});
  document.fonts.ready.then(requestRender);
}

const searchForm=document.querySelector('.catalog-search');
const search=document.querySelector('#project-search');
const projects=[...document.querySelectorAll('[data-project]')];
const count=document.querySelector('#catalog-count');
const empty=document.querySelector('#catalog-empty');
const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g,' ').trim();
function filter(updateURL=true){const terms=normalize(search.value).split(' ').filter(Boolean);let visible=0;for(const row of projects){const haystack=normalize(row.dataset.search);row.hidden=!terms.every(term=>haystack.includes(term));if(!row.hidden)visible++;}count.textContent=terms.length?`${projects.length}개 중 ${visible}개 프로젝트`:`${projects.length}개의 프로젝트`;empty.hidden=visible!==0;if(updateURL){const url=new URL(location.href);if(search.value.trim())url.searchParams.set('q',search.value.trim());else url.searchParams.delete('q');history.replaceState(null,'',url);}}
searchForm.hidden=false;
search.value=new URL(location.href).searchParams.get('q')||'';filter(false);
search.addEventListener('input',()=>filter());
searchForm.addEventListener('submit',event=>{event.preventDefault();filter();});
searchForm.addEventListener('reset',event=>{event.preventDefault();search.value='';filter();search.focus();});
search.addEventListener('keydown',event=>{if(event.key==='Escape'){search.value='';filter();}});
window.addEventListener('popstate',()=>{search.value=new URL(location.href).searchParams.get('q')||'';filter(false);});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();const main=document.querySelector('#main');main.focus();main.scrollIntoView();});
