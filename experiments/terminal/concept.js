const form = document.querySelector('#command-form');
const input = document.querySelector('#command-input');
const log = document.querySelector('#command-log');
const stage = document.querySelector('#ascii-stage');
const output = document.querySelector('#aircraft-ascii');
const viewStatus = document.querySelector('#view-status');
const views = {
  perspective: { yaw: -.58, pitch: .58 },
  side: { yaw: 0, pitch: 0 },
  front: { yaw: Math.PI / 2, pitch: 0 },
  top: { yaw: 0, pitch: Math.PI / 2 },
};
let angles = { ...views.perspective };
let aircraft;
let frame;
let history = [];
let historyIndex = 0;
let historyDraft = '';

function appendLog(command, message, links = []) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const prompt = document.createElement('p');
  prompt.className = 'log-command';
  prompt.textContent = `❯ ${command}`;
  const answer = document.createElement('p');
  answer.className = 'log-answer';
  answer.textContent = message;
  for (const link of links) {
    answer.append(document.createElement('br'));
    const anchor = document.createElement('a');
    anchor.textContent = link.label;
    anchor.href = link.href;
    answer.append(anchor);
  }
  entry.append(prompt, answer);
  log.append(entry);
  while (log.children.length > 30) log.firstElementChild.remove();
  log.scrollTop = log.scrollHeight;
}

function setView(name) {
  if (!Object.hasOwn(views, name)) return false;
  angles = { ...views[name] };
  viewStatus.textContent = name;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  scheduleDraw();
  return true;
}

function rotate(yaw, pitch = 0) {
  angles.yaw += yaw;
  angles.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angles.pitch + pitch));
  viewStatus.textContent = 'custom';
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  scheduleDraw();
}

function run(raw, record = true) {
  const command = raw.trim().replace(/\s+/g, ' ');
  if (!command) return;
  if (record) {
    if (history.at(-1) !== command) history.push(command);
    if (history.length > 100) history.shift();
    historyIndex = history.length;
    historyDraft = '';
  }
  const [name, argument, extra] = command.toLowerCase().split(' ');
  if (name === 'clear' && !argument) { log.replaceChildren(); appendLog('clear', '기록을 비웠습니다. help로 명령을 볼 수 있습니다.'); return; }
  if (name === 'help' && !argument) {
    appendLog(command, 'work — 프로젝트 목록\nwork shinsungin / work momu — 자세히 보기\nabout — 활동과 이력\nview perspective / side / front / top\nrotate left / right / up / down / reset\nclear — 이 창의 기록 지우기'); return;
  }
  if (name === 'whoami' && !argument) { appendLog(command, '정지원 / Jiwon Jung\n숭실대학교 재학 중. 개발과 기획을 합니다.'); return; }
  if (name === 'about' && !argument) {
    const entries = [...document.querySelectorAll('.activity-list li')].map(item => item.textContent.trim().replace(/\s+/g, ' '));
    appendLog(command, entries.join('\n'), [{label:'CV로 이동',href:'#about'}]); return;
  }
  if (name === 'work' && !extra) {
    if (!argument) {
      const links = [...document.querySelectorAll('.all-projects li a')].map(link => ({label:link.firstElementChild.textContent,href:link.href}));
      appendLog(command, `${links.length}개의 프로젝트가 있습니다.`, [{label:'고정 프로젝트 펼쳐 보기',href:'#work'}, ...links]); return;
    }
    const project = [...document.querySelectorAll('[data-project]')].find(item => item.dataset.project === argument);
    if (project) {
      project.open = true;
      const title = project.querySelector('.project-name').textContent;
      appendLog(command, `${title}의 상세 내용을 펼쳤습니다.`, [{label:`${title} 내용으로 이동`,href:`#${project.id}`}]);
      project.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
      project.querySelector('summary').focus({preventScroll:true});
      return;
    }
  }
  if (name === 'view' && argument && !extra && setView(argument)) { appendLog(command, `787 시점: ${argument}`); return; }
  if (name === 'rotate' && argument && !extra) {
    if (argument === 'reset') { setView('perspective'); appendLog(command, '처음 시점으로 돌아왔습니다.'); return; }
    const changes = {left:[-.25,0],right:[.25,0],up:[0,.18],down:[0,-.18]};
    if (Object.hasOwn(changes, argument)) { rotate(...changes[argument]); appendLog(command, `787 회전: ${argument}`); return; }
  }
  appendLog(command, '이 명령은 아직 없습니다. help를 입력하면 사용할 수 있는 명령이 나옵니다.');
}

form.addEventListener('submit', event => { event.preventDefault(); const value = input.value; input.value = ''; run(value); });
document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => run(button.dataset.command)));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => run(`view ${button.dataset.view}`)));
input.addEventListener('keydown', event => {
  if (!['ArrowUp','ArrowDown'].includes(event.key) || !history.length) return;
  event.preventDefault();
  if (historyIndex === history.length) historyDraft = input.value;
  historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
  input.value = historyIndex === history.length ? historyDraft : history[historyIndex];
  input.setSelectionRange(input.value.length, input.value.length);
});

const projectSearch = document.querySelector('#project-search');
const projectReset = document.querySelector('#project-search-reset');
const projectRows = [...document.querySelectorAll('#project-list > li')];
function filterProjects() {
  const query = projectSearch.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const row of projectRows) {
    row.hidden = !row.textContent.toLocaleLowerCase().includes(query);
    if (!row.hidden) count++;
  }
  document.querySelector('#project-search-count').textContent = `${count}개 프로젝트`;
  document.querySelector('#project-search-empty').hidden = count !== 0;
  projectReset.hidden = !projectSearch.value;
}
projectSearch.addEventListener('input', filterProjects);
projectReset.addEventListener('click', () => { projectSearch.value = ''; filterProjects(); projectSearch.focus(); });

function transform(x, y, z) {
  const cy = Math.cos(angles.yaw), sy = Math.sin(angles.yaw), cp = Math.cos(angles.pitch), sp = Math.sin(angles.pitch);
  const horizontal = x * cy + z * sy;
  const depth = -x * sy + z * cy;
  return [horizontal, y * cp - depth * sp, y * sp + depth * cp];
}

function drawAircraft() {
  frame = null;
  if (!aircraft || document.hidden) return;
  const font = parseFloat(getComputedStyle(output).fontSize);
  const columns = Math.max(40, Math.min(112, Math.floor((stage.clientWidth - 6) / (font * .603))));
  const rows = Math.max(26, Math.min(39, Math.round(columns * .35)));
  const data = aircraft.positions;
  const transformed = new Float32Array(data.length);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for (let i=0;i<data.length;i+=3) {
    const p=transform(data[i],data[i+1],data[i+2]);
    transformed.set(p,i); minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);
  }
  const scale=Math.min((columns-8)/(maxX-minX),(rows-5)*2.05/(maxY-minY));
  const midX=(minX+maxX)/2,midY=(minY+maxY)/2;
  const cells=Array(columns*rows).fill(' '),depths=new Float32Array(columns*rows).fill(-Infinity);
  // Fixed stars are punctuation around the model, not a running particle effect.
  for(let row=2;row<rows-2;row++)for(let col=2;col<columns-2;col++)if((row*193+col*79)%433===0)cells[row*columns+col]='·';
  const shades=' .:-=+*#%@';
  const screen = index => [((transformed[index]-midX)*scale+columns/2), (rows/2-(transformed[index+1]-midY)*scale/2.05), transformed[index+2]];
  for(let i=0;i<transformed.length;i+=9){
    const a=screen(i),b=screen(i+3),c=screen(i+6);
    const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(denominator)<.00001)continue;
    const n=transform(aircraft.normals[i],aircraft.normals[i+1],aircraft.normals[i+2]);
    const lighting=.32+.68*Math.max(0,n[0]*.3+n[1]*.65+n[2]*.7);
    const color=aircraft.colors ? (.2126*aircraft.colors[i]+.7152*aircraft.colors[i+1]+.0722*aircraft.colors[i+2]) : 1;
    const shade=shades[Math.max(2,Math.min(shades.length-1,Math.round(lighting*(.5+color*.5)*(shades.length-1))))];
    const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(columns-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(rows-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/denominator;
      const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/denominator;
      const w=1-u-v;if(u<0||v<0||w<0)continue;
      const z=u*a[2]+v*b[2]+w*c[2],index=y*columns+x;
      if(z>depths[index]){depths[index]=z;cells[index]=shade;}
    }
  }
  output.textContent=Array.from({length:rows},(_,row)=>cells.slice(row*columns,(row+1)*columns).join('')).join('\n');
  stage.dataset.rendered='true';
}

function scheduleDraw(){if(!frame)frame=requestAnimationFrame(drawAircraft);}
new ResizeObserver(scheduleDraw).observe(stage);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleDraw();});
stage.addEventListener('keydown',event=>{
  const change={ArrowLeft:[-.16,0],ArrowRight:[.16,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};
  if(Object.hasOwn(change,event.key)){event.preventDefault();rotate(...change[event.key]);}
  else if(event.key==='Home'){event.preventDefault();setView('perspective');}
});
let drag;
stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY};stage.setPointerCapture(event.pointerId);});
stage.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag={x:event.clientX,y:event.clientY};rotate(dx*.008,event.pointerType==='touch'?0:dy*.008);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,()=>{drag=null;});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();document.querySelector('#main').focus();document.querySelector('#main').scrollIntoView();});

try {
  const {createAircraft}=await import('/aircraft/model.mjs');
  aircraft=createAircraft();
  scheduleDraw();
} catch {
  output.textContent='787\n\n그래픽을 불러오지 못했습니다.\n프로젝트와 명령은 그대로 사용할 수 있습니다.';
  viewStatus.textContent='unavailable';
}
