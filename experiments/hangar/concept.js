import { createAircraft } from '/aircraft/model.mjs';

const surface = document.querySelector('#model-surface');
const canvas = document.querySelector('#aircraft-canvas');
const fallbackCanvas = document.querySelector('#aircraft-fallback');
const status = document.querySelector('#model-status');
const zoom = document.querySelector('#model-zoom');
const zoomValue = document.querySelector('#zoom-value');
const wireToggle = document.querySelector('#wire-toggle');
const aircraft = createAircraft();
const presetViews = {
  three: { azimuth: .78, elevation: .38, label: '사선에서 보고 있습니다.' },
  front: { azimuth: Math.PI / 2, elevation: .025, label: '정면에서 보고 있습니다.' },
  side: { azimuth: 0, elevation: .025, label: '측면에서 보고 있습니다.' },
  top: { azimuth: 0, elevation: Math.PI / 2 - .01, label: '위에서 보고 있습니다.' },
};
let state = { ...presetViews.three, zoom: 1, wire: false };
surface.dataset.view='three';
let fitView='three', fittedCamera;
let gl, program, buffers, uniforms, attributes, pendingFrame = 0;
let fallbackMode = false;
const count = aircraft.positions.length / 3;
const lineCount = aircraft.wireSegments.length / 3;
const center = aircraft.bounds?.center || [0,0,0];
const normalize = vector => {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value=>value / length);
};
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot = (a,b) => a.reduce((sum,value,index)=>sum+value*b[index],0);
function multiply(a,b) {
  const result = new Float32Array(16);
  for (let column=0;column<4;column++) for(let row=0;row<4;row++) {
    result[column*4+row] = a[row]*b[column*4] + a[4+row]*b[column*4+1] + a[8+row]*b[column*4+2] + a[12+row]*b[column*4+3];
  }
  return result;
}
function perspective(fov,aspect,near,far) {
  const scale=1/Math.tan(fov/2), range=1/(near-far);
  return new Float32Array([scale/aspect,0,0,0,0,scale,0,0,0,0,(far+near)*range,-1,0,0,2*far*near*range,0]);
}
function lookAt(eye,target) {
  const z = normalize(eye.map((value,index)=>value-target[index]));
  const x = normalize(cross([0,1,0],z));
  const y = cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
function cameraState() {
  const width=Math.max(1,surface.clientWidth), height=Math.max(1,surface.clientHeight);
  const aspect=width/height;
  const key=`${width}:${height}:${fitView}`;
  if(fittedCamera?.key!==key){
    const fit=presetViews[fitView], tangent=Math.tan(.65/2);
    const z=normalize([Math.sin(fit.azimuth)*Math.cos(fit.elevation),Math.sin(fit.elevation),Math.cos(fit.azimuth)*Math.cos(fit.elevation)]);
    const x=normalize(cross([0,1,0],z)), y=cross(z,x);
    let distance=1;
    for(let index=0;index<aircraft.positions.length;index+=3){
      const p=[aircraft.positions[index]-center[0],aircraft.positions[index+1]-center[1],aircraft.positions[index+2]-center[2]];
      const depth=dot(z,p);
      distance=Math.max(distance,Math.abs(dot(x,p))/(tangent*aspect)+depth,Math.abs(dot(y,p))/tangent+depth);
    }
    fittedCamera={key,distance:distance*1.17};
  }
  const distance=fittedCamera.distance/state.zoom;
  const eye=[
    center[0]+Math.sin(state.azimuth)*Math.cos(state.elevation)*distance,
    center[1]+Math.sin(state.elevation)*distance,
    center[2]+Math.cos(state.azimuth)*Math.cos(state.elevation)*distance,
  ];
  return {width,height,eye,matrix:multiply(perspective(.65,aspect,.1,150),lookAt(eye,center))};
}
const vertexSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec3 aColor;
  uniform mat4 uMatrix;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;
  void main(){
    vNormal=aNormal;vColor=aColor;vPosition=aPosition;
    gl_Position=uMatrix*vec4(aPosition,1.0);
  }
`;
const fragmentSource = `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;
  uniform vec3 uCamera;
  uniform float uWire;
  void main(){
    if(uWire>0.5){gl_FragColor=vec4(0.72,0.78,1.0,1.0);return;}
    vec3 n=normalize(vNormal);
    vec3 light=normalize(vec3(0.6,1.0,0.8));
    vec3 fill=normalize(vec3(-0.7,0.3,-0.8));
    vec3 view=normalize(uCamera-vPosition);
    float lighting=0.28+0.61*max(dot(n,light),0.0)+0.18*max(dot(n,fill),0.0);
    float spec=pow(max(dot(n,normalize(light+view)),0.0),36.0)*0.18;
    float rim=pow(1.0-max(dot(n,view),0.0),3.0)*0.055;
    gl_FragColor=vec4(vColor*lighting+vec3(0.78,0.82,1.0)*(spec+rim),1.0);
  }
`;
function shader(type,source) {
  const value=gl.createShader(type);
  gl.shaderSource(value,source);gl.compileShader(value);
  if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)) { gl.deleteShader(value); throw new Error('Shader unavailable'); }
  return value;
}
function makeBuffer(values) {
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);
  return buffer;
}
function initializeWebGL() {
  gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if(!gl) throw new Error('WebGL unavailable');
  const vertex=shader(gl.VERTEX_SHADER,vertexSource), fragment=shader(gl.FRAGMENT_SHADER,fragmentSource);
  program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Program unavailable');
  buffers={positions:makeBuffer(aircraft.positions),normals:makeBuffer(aircraft.normals),colors:makeBuffer(aircraft.colors),lines:makeBuffer(aircraft.wireSegments)};
  attributes={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),color:gl.getAttribLocation(program,'aColor')};
  uniforms={matrix:gl.getUniformLocation(program,'uMatrix'),camera:gl.getUniformLocation(program,'uCamera'),wire:gl.getUniformLocation(program,'uWire')};
  fallbackMode=false;canvas.hidden=false;fallbackCanvas.hidden=true;
  surface.dataset.renderer='webgl';canvas.dataset.renderer='webgl';
  document.querySelector('#model-kind').textContent='3D sketch';
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
}
function useFallback() {
  fallbackMode=true;canvas.hidden=true;fallbackCanvas.hidden=false;
  surface.dataset.renderer='canvas';fallbackCanvas.dataset.renderer='canvas';
  document.querySelector('#model-kind').textContent='3D wireframe';
  status.textContent='3D 가속을 사용할 수 없어 같은 모델을 선으로 표시합니다. 시점 조작은 계속 사용할 수 있습니다.';
}
function attribute(location,buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
}
function drawFallback(camera) {
  const context=fallbackCanvas.getContext('2d');
  if(!context) return;
  const dpr=Math.min(window.devicePixelRatio||1,2), width=Math.round(camera.width*dpr), height=Math.round(camera.height*dpr);
  if(fallbackCanvas.width!==width||fallbackCanvas.height!==height){fallbackCanvas.width=width;fallbackCanvas.height=height;}
  context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,camera.width,camera.height);
  context.strokeStyle='#aebcff';context.lineWidth=.8;
  const project=(index)=>{
    const [x,y,z]=aircraft.wireSegments.subarray(index,index+3),m=camera.matrix;
    const w=m[3]*x+m[7]*y+m[11]*z+m[15];
    return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w*camera.width*.5+camera.width*.5, camera.height*.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/w*camera.height*.5,w];
  };
  context.beginPath();
  for(let index=0;index<aircraft.wireSegments.length;index+=6){const a=project(index),b=project(index+3);if(a[2]>0&&b[2]>0){context.moveTo(a[0],a[1]);context.lineTo(b[0],b[1]);}}
  context.stroke();
}
function draw() {
  pendingFrame=0;
  const camera=cameraState();
  surface.dataset.azimuth=state.azimuth.toFixed(3);surface.dataset.elevation=state.elevation.toFixed(3);surface.dataset.zoom=state.zoom.toFixed(2);
  if(fallbackMode){drawFallback(camera);return;}
  const dpr=Math.min(window.devicePixelRatio||1,2), width=Math.round(camera.width*dpr),height=Math.round(camera.height*dpr);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
  gl.uniformMatrix4fv(uniforms.matrix,false,camera.matrix);gl.uniform3fv(uniforms.camera,camera.eye);gl.uniform1f(uniforms.wire,state.wire?1:0);
  attribute(attributes.position,state.wire?buffers.lines:buffers.positions);
  if(state.wire){
    gl.disableVertexAttribArray(attributes.normal);gl.vertexAttrib3f(attributes.normal,0,1,0);
    gl.disableVertexAttribArray(attributes.color);gl.vertexAttrib3f(attributes.color,.7,.8,1);
    gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.LINES,0,lineCount);gl.enable(gl.DEPTH_TEST);
  }else{
    attribute(attributes.normal,buffers.normals);attribute(attributes.color,buffers.colors);gl.drawArrays(gl.TRIANGLES,0,count);
  }
}
function requestDraw() { if(!pendingFrame)pendingFrame=requestAnimationFrame(draw); }
function markPreset(name) { surface.dataset.view=name||'custom';for(const button of document.querySelectorAll('.view-buttons button[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===name)); }
function setView(name) {
  if(!Object.hasOwn(presetViews,name))return;
  state={...state,...presetViews[name]};fitView=name;markPreset(name);requestDraw();status.textContent=presetViews[name].label;
}
for(const button of document.querySelectorAll('.view-buttons button[data-view]'))button.addEventListener('click',()=>setView(button.dataset.view));
wireToggle.addEventListener('click',()=>{
  state.wire=!state.wire;wireToggle.setAttribute('aria-pressed',String(state.wire));requestDraw();
  status.textContent=fallbackMode?'이 환경에서는 선으로 표시합니다.':state.wire?'구조를 선으로 보고 있습니다.':'입체 표면을 보고 있습니다.';
});
zoom.addEventListener('input',()=>{state.zoom=Number(zoom.value)/100;zoomValue.value=`${zoom.value}%`;requestDraw();});
document.querySelector('#model-reset').addEventListener('click',()=>{
  state={...presetViews.three,zoom:1,wire:false};fitView='three';zoom.value='100';zoomValue.value='100%';wireToggle.setAttribute('aria-pressed','false');markPreset('three');requestDraw();status.textContent='처음 시점으로 돌아왔습니다.';
});
let drag;
surface.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,azimuth:state.azimuth,elevation:state.elevation};
  surface.setPointerCapture(event.pointerId);surface.dataset.dragging='true';
});
surface.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  state.azimuth=drag.azimuth-(event.clientX-drag.x)*.008;
  state.elevation=Math.max(-1.35,Math.min(1.55,drag.elevation+(event.clientY-drag.y)*.006));
  markPreset('');requestDraw();
});
function endDrag(event) {
  if(!drag||event.pointerId!==drag.id)return;
  if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);
  drag=null;surface.dataset.dragging='false';status.textContent='시점을 직접 돌렸습니다.';
}
surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);
surface.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='Home'){setView('three');return;}
  if(event.key==='ArrowLeft')state.azimuth+=.12;
  if(event.key==='ArrowRight')state.azimuth-=.12;
  if(event.key==='ArrowUp')state.elevation=Math.min(1.55,state.elevation+.1);
  if(event.key==='ArrowDown')state.elevation=Math.max(-1.35,state.elevation-.1);
  markPreset('');requestDraw();status.textContent='방향키로 시점을 돌렸습니다.';
});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();useFallback();requestDraw();});
canvas.addEventListener('webglcontextrestored',()=>{try{initializeWebGL();status.textContent='3D 보기가 복원되었습니다.';}catch{useFallback();}requestDraw();});
try{initializeWebGL();}catch{useFallback();}
if(typeof ResizeObserver==='function')new ResizeObserver(requestDraw).observe(surface);
else window.addEventListener('resize',requestDraw);
requestDraw();
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();document.querySelector('#main').focus();document.querySelector('#main').scrollIntoView();});

const projectSearch=document.querySelector('#project-search');
const projectReset=document.querySelector('#project-search-reset');
const projectRows=[...document.querySelectorAll('[data-project-row]')];
const normalizeSearch=value=>value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim().replace(/\s+/g,' ');
function filterProjects(){
  const query=normalizeSearch(projectSearch.value);
  const terms=query.split(' ').filter(Boolean);
  let visible=0;
  for(const row of projectRows){
    const searchable=normalizeSearch(row.dataset.search);
    row.hidden=!terms.every(term=>searchable.includes(term));
    if(!row.hidden)visible++;
  }
  document.querySelector('#project-count').textContent=query?`${projectRows.length}개 중 ${visible}개 프로젝트`:`${visible}개 프로젝트`;
  document.querySelector('#project-empty').hidden=visible!==0;
  projectReset.disabled=projectSearch.value.length===0;
}
function resetProjectSearch(){projectSearch.value='';filterProjects();projectSearch.focus();}
projectSearch.addEventListener('input',filterProjects);
projectSearch.addEventListener('keydown',event=>{if(event.key==='Escape'&&projectSearch.value){event.preventDefault();resetProjectSearch();}});
projectReset.addEventListener('click',resetProjectSearch);
