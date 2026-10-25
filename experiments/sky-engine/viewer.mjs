const views = Object.freeze({
  three: { azimuth: .52, elevation: .62, roll: 0 },
  side: { azimuth: 0, elevation: .025, roll: 0 },
  top: { azimuth: 0, elevation: Math.PI / 2 - .01, roll: 0 },
});
const defaultInputOptions = Object.freeze({ drag: true, scroll: false, pointer: false, axis: 'both', type: 'orbit', sensitivity: 1, inertia: .5, reducedMotion: 'system' });
function mergeInputOptions(previous, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return null;
  const next = { ...previous };
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (!Object.hasOwn(defaultInputOptions, key)) return null;
    if (['drag', 'scroll', 'pointer'].includes(key) && typeof value !== 'boolean') return null;
    if (key === 'axis' && !['horizontal', 'vertical', 'both'].includes(value)) return null;
    if (key === 'type' && !['orbit', 'bank'].includes(value)) return null;
    if (key === 'reducedMotion' && !['system', 'reduce', 'full'].includes(value)) return null;
    if (key === 'sensitivity' && (!Number.isFinite(value) || value < .25 || value > 2.5)) return null;
    if (key === 'inertia' && (!Number.isFinite(value) || value < 0 || value > 1)) return null;
    next[key] = value;
  }
  return next;
}
const instances = new WeakMap();
const fieldOfView = .42;
let modelPromise;

function loadModel() {
  if (!modelPromise) {
    modelPromise = import('/aircraft-v2/model.mjs').then(({ createAircraft }) => {
      const model = createAircraft();
      const length = model.positions?.length;
      if (!length || length % 9 || model.normals?.length !== length || model.colors?.length !== length) {
        throw new Error('Incomplete aircraft geometry');
      }
      for (const key of ['positions', 'normals', 'colors']) {
        if (!model[key].every(Number.isFinite)) throw new Error('Invalid aircraft geometry');
      }
      if (model.bounds?.center?.length !== 3 || !model.bounds.center.every(Number.isFinite)) {
        throw new Error('Invalid aircraft bounds');
      }
      return model;
    }).catch(error => { modelPromise = undefined; throw error; });
  }
  return modelPromise;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = vector => {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value => value / length);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function basis(angles) {
  const z = [Math.sin(angles.azimuth) * Math.cos(angles.elevation), Math.sin(angles.elevation), Math.cos(angles.azimuth) * Math.cos(angles.elevation)];
  const right = normalize(cross([0, 1, 0], z)), up = cross(z, right);
  const cosine = Math.cos(angles.roll || 0), sine = Math.sin(angles.roll || 0);
  return { x: right.map((value, i) => value * cosine + up[i] * sine), y: up.map((value, i) => value * cosine - right[i] * sine), z };
}

function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) for (let row = 0; row < 4; row++) {
    result[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
  }
  return result;
}

function cameraFor(model, angles, distance, width, height) {
  const { x, y, z } = basis(angles);
  const eye = model.bounds.center.map((value, index) => value + z[index] * distance);
  const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
  const f = 1 / Math.tan(fieldOfView / 2), near = .1, far = Math.max(150, distance + 40), range = 1 / (near - far);
  const projection = new Float32Array([f * height / width, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0]);
  return { matrix: multiply(projection, view), eye };
}

function fitDistance(model, angles, width, height) {
  const { x, y, z } = basis(angles), center = model.bounds.center;
  const vertical = Math.tan(fieldOfView / 2), horizontal = vertical * width / height;
  let distance = 1;
  for (let i = 0; i < model.positions.length; i += 3) {
    const px = model.positions[i] - center[0], py = model.positions[i + 1] - center[1], pz = model.positions[i + 2] - center[2];
    const depth = z[0] * px + z[1] * py + z[2] * pz;
    distance = Math.max(distance, Math.abs(x[0] * px + x[1] * py + x[2] * pz) / horizontal + depth, Math.abs(y[0] * px + y[1] * py + y[2] * pz) / vertical + depth);
  }
  return distance * 1.13;
}

function createSolidRenderer(canvas, model) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl || gl.isContextLost()) throw new Error('WebGL unavailable');
  const shaders = [], buffers = [];
  const program = gl.createProgram();
  const destroy = () => {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
  };
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
    gl.attachShader(program, shader);
  };
  try {
    compile(gl.VERTEX_SHADER, `
      attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor;
      uniform mat4 uMatrix; varying vec3 vPosition; varying vec3 vNormal; varying vec3 vColor;
      void main() { vPosition=aPosition; vNormal=aNormal; vColor=aColor; gl_Position=uMatrix*vec4(aPosition,1.0); }
    `);
    compile(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 vPosition; varying vec3 vNormal; varying vec3 vColor; uniform vec3 uEye;
      void main() {
        vec3 n=normalize(vNormal), light=normalize(vec3(.6,1.,.8)), fill=normalize(vec3(-.7,.3,-.8));
        vec3 sight=normalize(uEye-vPosition);
        float diffuse=.3+.61*max(dot(n,light),0.)+.16*max(dot(n,fill),0.);
        float specular=pow(max(dot(n,normalize(light+sight)),0.),32.)*.15;
        float rim=pow(1.-max(dot(n,sight),0.),3.)*.035;
        gl_FragColor=vec4(vColor*diffuse+vec3(.78,.82,1.)*(specular+rim),1.);
      }
    `);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program unavailable');
    const attributes = [['aPosition', model.positions], ['aNormal', model.normals], ['aColor', model.colors]].map(([name, values]) => {
      const buffer = gl.createBuffer(); buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
      return { buffer, location: gl.getAttribLocation(program, name) };
    });
    const matrix = gl.getUniformLocation(program, 'uMatrix'), eye = gl.getUniformLocation(program, 'uEye');
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0);
    return {
      draw(camera, width, height) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const pixelWidth = Math.max(1, Math.round(width * ratio)), pixelHeight = Math.max(1, Math.round(height * ratio));
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
        gl.viewport(0, 0, pixelWidth, pixelHeight); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(program);
        gl.uniformMatrix4fv(matrix, false, camera.matrix); gl.uniform3fv(eye, camera.eye);
        for (const attribute of attributes) {
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer); gl.enableVertexAttribArray(attribute.location);
          gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, model.positions.length / 3);
      },
      destroy,
    };
  } catch (error) { destroy(); throw error; }
}

function createAsciiRenderer(pre, model) {
  const projected = new Float32Array(model.positions.length);
  const light = normalize([.6, 1, .8]);
  const shades = ' .:-=+*#%@';
  const vertexLighting = new Float32Array(model.positions.length / 3);
  for (let i = 0; i < model.positions.length; i += 3) {
    const normal = [model.normals[i], model.normals[i + 1], model.normals[i + 2]];
    const color = .2126 * model.colors[i] + .7152 * model.colors[i + 1] + .0722 * model.colors[i + 2];
    vertexLighting[i / 3] = (.22 + .86 * Math.max(0, dot(normal, light))) * (.15 + color * .85);
  }
  let cells, depths, previousColumns = 0, previousRows = 0;
  return {
    draw(camera, width, height) {
      const columns = clamp(Math.floor(width / 4.3), 40, 156);
      const fontSize = width / (columns * .61);
      const rows = clamp(Math.floor(height / (fontSize * 1.16)), 18, 88);
      if (columns !== previousColumns || rows !== previousRows) {
        cells = Array(columns * rows); depths = new Float32Array(columns * rows);
        previousColumns = columns; previousRows = rows;
      }
      pre.style.fontSize = `${fontSize}px`; pre.style.lineHeight = `${height / rows}px`;
      cells.fill(' '); depths.fill(Infinity);
      const m = camera.matrix, positions = model.positions;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i], y = positions[i + 1], z = positions[i + 2];
        const w = m[3] * x + m[7] * y + m[11] * z + m[15];
        projected[i] = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) * columns / 2;
        projected[i + 1] = (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w) * rows / 2;
        projected[i + 2] = w <= 0 ? Infinity : (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
      }
      for (let i = 0; i < projected.length; i += 9) {
        const ax = projected[i], ay = projected[i + 1], az = projected[i + 2];
        const bx = projected[i + 3], by = projected[i + 4], bz = projected[i + 5];
        const cx = projected[i + 6], cy = projected[i + 7], cz = projected[i + 8];
        if (!Number.isFinite(az + bz + cz)) continue;
        const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
        if (Math.abs(denominator) < .00001) continue;
        const left = Math.max(0, Math.floor(Math.min(ax, bx, cx))), right = Math.min(columns - 1, Math.ceil(Math.max(ax, bx, cx)));
        const top = Math.max(0, Math.floor(Math.min(ay, by, cy))), bottom = Math.min(rows - 1, Math.ceil(Math.max(ay, by, cy)));
        for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
          const u = ((by - cy) * (x + .5 - cx) + (cx - bx) * (y + .5 - cy)) / denominator;
          const v = ((cy - ay) * (x + .5 - cx) + (ax - cx) * (y + .5 - cy)) / denominator;
          const w = 1 - u - v;
          if (u < 0 || v < 0 || w < 0) continue;
          const depth = u * az + v * bz + w * cz, cell = y * columns + x;
          if (depth < depths[cell]) {
            depths[cell] = depth;
            const lighting = u * vertexLighting[i / 3] + v * vertexLighting[i / 3 + 1] + w * vertexLighting[i / 3 + 2];
            cells[cell] = shades[clamp(Math.round(lighting * (shades.length - 1)), 1, shades.length - 1)];
          }
        }
      }
      pre.textContent = Array.from({ length: rows }, (_, row) => cells.slice(row * columns, (row + 1) * columns).join('')).join('\n');
    },
  };
}

/** Mount a transparent, on-demand 787 scene. The host supplies its dimensions and color. */
export function createSkyViewer(host, { mode = 'ascii', interactive = true, inputOptions = {} } = {}) {
  if (!host || host.nodeType !== 1) throw new TypeError('A viewer host element is required');
  if (!['ascii', 'solid'].includes(mode)) throw new TypeError('Viewer mode must be ascii or solid');
  let inputs = mergeInputOptions(defaultInputOptions, inputOptions);
  if (!inputs) throw new TypeError('Invalid viewer input options');
  if (!interactive) inputs = { ...inputs, drag: false, scroll: false, pointer: false };
  instances.get(host)?.destroy();
  const originalAttributes = new Map(['tabindex', 'role', 'aria-label', 'aria-busy', 'aria-keyshortcuts', 'data-ready', 'data-mode', 'data-view', 'data-renderer', 'data-animating', 'data-dragging', 'data-render-count', 'data-azimuth', 'data-elevation', 'data-roll'].map(name => [name, host.getAttribute(name)]));
  const originalTouchAction = host.style.touchAction;
  const listeners = [];
  const listen = (target, event, callback, options) => {
    target.addEventListener(event, callback, options);
    listeners.push(() => target.removeEventListener(event, callback, options));
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.createElement('div');
  root.className = 'sky-viewer';
  Object.assign(root.style, { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'transparent', userSelect: 'none' });
  const canvas = document.createElement('canvas'), pre = document.createElement('pre'), status = document.createElement('p');
  canvas.className = 'sky-viewer-canvas'; pre.className = 'sky-viewer-ascii'; status.className = 'sky-viewer-status';
  for (const graphic of [canvas, pre]) {
    graphic.setAttribute('aria-hidden', 'true');
    Object.assign(graphic.style, { position: 'absolute', inset: '0', display: 'block', width: '100%', height: '100%', margin: '0', padding: '0', border: '0', background: 'transparent', pointerEvents: 'none', overflow: 'hidden' });
  }
  Object.assign(pre.style, { color: 'inherit', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontWeight: '400', fontVariantLigatures: 'none', letterSpacing: '0', whiteSpace: 'pre', textAlign: 'left' });
  Object.assign(status.style, { position: 'absolute', insetInline: '16px', bottom: '12px', margin: '0', color: 'inherit', font: 'inherit', fontSize: '11px', lineHeight: '1.6', textAlign: 'center', pointerEvents: 'none' });
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  status.textContent = '787 장면을 불러오고 있습니다.';
  root.append(canvas, pre, status); host.append(root);
  if (!host.getAttribute('role')) host.setAttribute('role', 'group');
  if (!host.getAttribute('aria-label')) host.setAttribute('aria-label', interactive ? '787에서 영감을 받은 3D 장면. 드래그하거나 방향키로 회전하고 Home으로 처음 시점으로 돌아갑니다.' : '787에서 영감을 받은 3D 장면');
  if (interactive) {
    if (!host.hasAttribute('tabindex')) host.tabIndex = 0;
    host.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown Home');
    host.style.touchAction = 'pan-y pinch-zoom';
  }
  let aircraft, ascii, solid, solidFailed = false, contextLost = false, destroyed = false;
  let ready = 'loading', renderer = 'text', view = 'three';
  let angles = { ...views.three }, distance = 30, width = 1, height = 1, renderCount = 0;
  let frame = 0, transition = null, inertia = null, drag = null, intersecting = true;
  let pointerAngles = { azimuth: 0, elevation: 0, roll: 0 }, pointerMotion = null;
  let externalReference = { ...views.three }, lastScroll = window.scrollY || 0;
  const visible = () => intersecting && !document.hidden;
  const reducedMotion = () => inputs.reducedMotion === 'reduce' || (inputs.reducedMotion === 'system' && motion.matches);
  const displayedAngles = () => ({ azimuth: angles.azimuth + pointerAngles.azimuth, elevation: clamp(angles.elevation + pointerAngles.elevation, -1.35, 1.55), roll: clamp(angles.roll + pointerAngles.roll, -.8, .8) });
  const animating = () => !!(transition || inertia || pointerMotion);
  const getState = () => ({ ready, mode, view, renderer, animating: animating(), dragging: !!drag, ...displayedAngles(), inputOptions: { ...inputs }, reducedMotion: reducedMotion(), renderCount });
  function publish() {
    if (destroyed) return;
    host.dataset.ready = ready; host.dataset.mode = mode; host.dataset.view = view; host.dataset.renderer = renderer;
    host.dataset.animating = String(animating());
    host.setAttribute('aria-busy', String(ready === 'loading'));
    host.dispatchEvent(new CustomEvent('skyviewerchange', { detail: getState() }));
  }
  function stopMotion(finishTransition = false) {
    if (finishTransition && transition) { angles = { ...transition.target }; distance = transition.distance; }
    if (finishTransition && pointerMotion) pointerAngles = { ...pointerMotion.target };
    transition = null; inertia = null; pointerMotion = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function schedule() {
    if (!destroyed && aircraft && visible() && !frame) frame = requestAnimationFrame(draw);
  }
  function measure() {
    if (destroyed) return;
    // Re-test percentage sizing after a hidden or initially empty host becomes visible.
    root.style.height = '100%';
    if (!root.clientHeight) {
      const style = window.getComputedStyle(host);
      const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      root.style.height = `${Math.max(0, host.clientHeight - padding) || 280}px`;
    }
    const nextWidth = Math.max(1, root.clientWidth || host.clientWidth), nextHeight = Math.max(1, root.clientHeight || host.clientHeight || 280);
    if (width === nextWidth && height === nextHeight) return;
    width = nextWidth; height = nextHeight;
    stopMotion(true);
    if (aircraft) distance = fitDistance(aircraft, angles, width, height);
    publish(); schedule();
  }
  function ensureRenderer() {
    if (mode === 'solid' && !solid && !solidFailed && !contextLost) {
      try { solid = createSolidRenderer(canvas, aircraft); }
      catch { solidFailed = true; }
    }
    const nextRenderer = mode === 'solid' && solid && !contextLost ? 'webgl' : mode === 'solid' ? 'ascii-fallback' : 'ascii';
    canvas.style.display = nextRenderer === 'webgl' ? 'block' : 'none';
    pre.style.display = nextRenderer === 'webgl' ? 'none' : 'block';
    const explanation = nextRenderer === 'ascii-fallback' ? '입체 가속을 사용할 수 없어 같은 3D 장면을 문자로 표시합니다.' : '';
    status.hidden = nextRenderer !== 'ascii-fallback';
    if (status.textContent !== explanation) status.textContent = explanation;
    if (renderer !== nextRenderer) { renderer = nextRenderer; publish(); }
  }
  function draw(now) {
    frame = 0;
    if (destroyed || !aircraft || !visible()) return;
    const wasAnimating = animating();
    if (transition) {
      const progress = clamp((now - transition.started) / 240, 0, 1), eased = 1 - (1 - progress) ** 3;
      angles.azimuth = transition.from.azimuth + transition.deltaAzimuth * eased;
      angles.elevation = transition.from.elevation + (transition.target.elevation - transition.from.elevation) * eased;
      angles.roll = transition.from.roll + (transition.target.roll - transition.from.roll) * eased;
      distance = transition.fromDistance + (transition.distance - transition.fromDistance) * eased;
      if (progress === 1) { angles = { ...transition.target }; distance = transition.distance; transition = null; }
    } else if (inertia) {
      const elapsed = Math.min(inertia.duration, now - inertia.started), decay = Math.exp(-elapsed / inertia.decay), travel = inertia.decay * (1 - decay);
      angles.azimuth = inertia.from.azimuth + inertia.x * travel;
      angles.elevation = clamp(inertia.from.elevation + inertia.y * travel, -1.35, 1.55);
      angles.roll = clamp(inertia.from.roll + inertia.roll * travel, -.8, .8);
      if (elapsed === inertia.duration || Math.max(Math.abs(inertia.x), Math.abs(inertia.y), Math.abs(inertia.roll)) * decay < .000015) inertia = null;
    }
    if (pointerMotion) {
      const progress = clamp((now - pointerMotion.started) / 140, 0, 1), eased = 1 - (1 - progress) ** 3;
      for (const key of ['azimuth', 'elevation', 'roll']) pointerAngles[key] = pointerMotion.from[key] + (pointerMotion.target[key] - pointerMotion.from[key]) * eased;
      if (progress === 1) pointerMotion = null;
    }
    ensureRenderer();
    const displayed = displayedAngles();
    // Widen only when a rotated wing would leave the frame; never zoom back in during a drag.
    if (view === 'custom' || inputs.pointer) distance = Math.max(distance, fitDistance(aircraft, displayed, width, height));
    const camera = cameraFor(aircraft, displayed, distance, width, height);
    if (renderer === 'webgl') solid.draw(camera, width, height);
    else ascii.draw(camera, width, height);
    renderCount++;
    host.dataset.renderCount = String(renderCount); host.dataset.azimuth = displayed.azimuth.toFixed(4); host.dataset.elevation = displayed.elevation.toFixed(4); host.dataset.roll = displayed.roll.toFixed(4);
    if (wasAnimating && !animating()) publish();
    if (animating()) schedule();
  }
  function setView(name, animate = true) {
    if (destroyed || !Object.hasOwn(views, name)) return false;
    stopMotion();
    const target = views[name], targetDistance = aircraft ? fitDistance(aircraft, target, width, height) : distance;
    externalReference = { ...target }; pointerAngles = { azimuth: 0, elevation: 0, roll: 0 };
    view = name;
    if (!animate || reducedMotion() || !visible() || !aircraft) { angles = { ...target }; distance = targetDistance; }
    else {
      transition = { started: performance.now(), from: { ...angles }, target, fromDistance: distance, distance: targetDistance, deltaAzimuth: Math.atan2(Math.sin(target.azimuth - angles.azimuth), Math.cos(target.azimuth - angles.azimuth)) };
    }
    publish(); schedule(); return true;
  }
  function setMode(nextMode) {
    if (destroyed || !['ascii', 'solid'].includes(nextMode)) return false;
    mode = nextMode; publish(); schedule(); return true;
  }
  function setOrientation(pose) {
    if (destroyed || !pose || typeof pose !== 'object') return false;
    const keys = ['azimuth', 'elevation', 'roll'];
    if (!keys.some(key => Object.hasOwn(pose, key)) || keys.some(key => Object.hasOwn(pose, key) && !Number.isFinite(pose[key]))) return false;
    if ((pose.immediate !== undefined && typeof pose.immediate !== 'boolean') || (pose.preserveInput !== undefined && typeof pose.preserveInput !== 'boolean')) return false;
    const reference = { ...externalReference }, target = { ...angles };
    for (const key of keys) if (Object.hasOwn(pose, key)) {
      reference[key] = key === 'elevation' ? clamp(pose[key], -1.35, 1.55) : key === 'roll' ? clamp(pose[key], -.8, .8) : pose[key];
      target[key] = pose.preserveInput ? angles[key] + reference[key] - externalReference[key] : reference[key];
    }
    target.elevation = clamp(target.elevation, -1.35, 1.55); target.roll = clamp(target.roll, -.8, .8);
    externalReference = reference; stopMotion(); view = 'custom';
    const targetDistance = aircraft ? Math.max(distance, fitDistance(aircraft, target, width, height)) : distance;
    if (pose.immediate || reducedMotion() || !visible() || !aircraft) { angles = target; distance = targetDistance; }
    else transition = { started: performance.now(), from: { ...angles }, target, fromDistance: distance, distance: targetDistance, deltaAzimuth: Math.atan2(Math.sin(target.azimuth - angles.azimuth), Math.cos(target.azimuth - angles.azimuth)) };
    publish(); schedule(); return true;
  }
  function setInputOptions(patch) {
    const next = mergeInputOptions(inputs, patch);
    if (destroyed || !next || (!interactive && (next.drag || next.scroll || next.pointer))) return false;
    endDrag(null, false); stopMotion(true); inputs = next;
    pointerAngles = { azimuth: 0, elevation: 0, roll: 0 }; lastScroll = window.scrollY || 0;
    publish(); schedule(); return true;
  }
  function inputDelta(x, y) {
    if (inputs.axis === 'vertical') x = 0;
    if (inputs.axis === 'horizontal') y = 0;
    return inputs.type === 'bank' ? { azimuth: x * .18, elevation: y * .5, roll: x * .8 } : { azimuth: x, elevation: y, roll: 0 };
  }
  function applyDelta(delta) {
    angles.azimuth += delta.azimuth; angles.elevation = clamp(angles.elevation + delta.elevation, -1.35, 1.55); angles.roll = clamp(angles.roll + delta.roll, -.8, .8);
    view = 'custom';
  }
  function followPointer(target) {
    if (reducedMotion() || !visible()) { pointerAngles = target; pointerMotion = null; }
    else pointerMotion = { from: { ...pointerAngles }, target, started: performance.now() };
    publish(); schedule();
  }
  function endDrag(event, continueMotion) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const previous = drag;
    drag = null; host.dataset.dragging = 'false';
    if (host.hasPointerCapture?.(previous.id)) host.releasePointerCapture(previous.id);
    if (continueMotion && inputs.inertia > 0 && previous.moved && performance.now() - previous.time < 90 && !reducedMotion() && visible()) {
      const strength = .4 + inputs.inertia * 1.2;
      const x = clamp(previous.vx, -.003, .003) * strength, y = clamp(previous.vy, -.003, .003) * strength, roll = clamp(previous.vr, -.003, .003) * strength;
      if (Math.max(Math.abs(x), Math.abs(y), Math.abs(roll)) > .00006) inertia = { started: performance.now(), from: { ...angles }, x, y, roll, duration: 300 + inputs.inertia * 600, decay: 60 + inputs.inertia * 120 };
    }
    publish(); schedule();
  }
  if (interactive) {
    listen(host, 'pointerdown', event => {
      if (!inputs.drag || drag || event.button !== 0 || event.isPrimary === false || !aircraft) return;
      stopMotion();
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, time: performance.now(), vx: 0, vy: 0, vr: 0, moved: false, touch: event.pointerType === 'touch' };
      host.setPointerCapture?.(event.pointerId); host.dataset.dragging = 'true';
      if (event.pointerType === 'mouse') host.focus({ preventScroll: true });
      publish();
    });
    listen(host, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.touch && !drag.moved) {
        const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { endDrag(event, false); return; }
        if (Math.abs(dx) < 6) return;
      }
      const now = performance.now(), elapsed = Math.max(8, now - drag.time);
      const x = -(event.clientX - drag.x) * .007 * inputs.sensitivity, y = drag.touch ? 0 : (event.clientY - drag.y) * .006 * inputs.sensitivity;
      const delta = inputDelta(x, y);
      if (!delta.azimuth && !delta.elevation && !delta.roll) return;
      applyDelta(delta);
      drag.vx = drag.vx * .25 + delta.azimuth / elapsed * .75; drag.vy = drag.vy * .25 + delta.elevation / elapsed * .75; drag.vr = drag.vr * .25 + delta.roll / elapsed * .75;
      drag.x = event.clientX; drag.y = event.clientY; drag.time = now; drag.moved = true;
      publish(); schedule();
    });
    listen(host, 'pointerup', event => endDrag(event, true));
    listen(host, 'pointercancel', event => endDrag(event, false));
    listen(host, 'lostpointercapture', event => endDrag(event, false));
    listen(host, 'keydown', event => {
      if (event.target !== host || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Home') { event.preventDefault(); setView('three', false); return; }
      const steps = { ArrowLeft: [.12, 0], ArrowRight: [-.12, 0], ArrowUp: [0, .1], ArrowDown: [0, -.1] };
      if (!Object.hasOwn(steps, event.key)) return;
      event.preventDefault(); stopMotion();
      applyDelta(inputDelta(steps[event.key][0] * inputs.sensitivity, steps[event.key][1] * inputs.sensitivity));
      publish(); schedule();
    });
    listen(host, 'pointermove', event => {
      if (!inputs.pointer || drag || event.pointerType !== 'mouse' || event.buttons || !aircraft || !visible()) return;
      const box = host.getBoundingClientRect();
      const x = clamp((event.clientX - box.left) / Math.max(1, box.width) * 2 - 1, -1, 1);
      const y = clamp((event.clientY - box.top) / Math.max(1, box.height) * 2 - 1, -1, 1);
      followPointer(inputDelta(-x * .28 * inputs.sensitivity, y * .19 * inputs.sensitivity));
    }, { passive: true });
    listen(host, 'pointerleave', () => { if (inputs.pointer && !drag) followPointer({ azimuth: 0, elevation: 0, roll: 0 }); });
    listen(window, 'scroll', () => {
      const next = window.scrollY || 0, delta = next - lastScroll; lastScroll = next;
      if (!inputs.scroll || !aircraft || !visible() || !delta) return;
      stopMotion();
      const amount = clamp(delta, -160, 160) / Math.max(500, window.innerHeight || 800) * .8 * inputs.sensitivity;
      applyDelta(inputDelta(amount * .8, amount * .45)); publish(); schedule();
    }, { passive: true });
  }
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  if (resizeObserver) resizeObserver.observe(host);
  else listen(window, 'resize', measure);
  const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    intersecting = entries[0]?.isIntersecting ?? true;
    if (!visible()) { endDrag(null, false); stopMotion(true); publish(); }
    else schedule();
  }) : null;
  intersectionObserver?.observe(host);
  listen(document, 'visibilitychange', () => {
    if (!visible()) { endDrag(null, false); stopMotion(true); publish(); }
    else schedule();
  });
  listen(motion, 'change', () => { if (reducedMotion()) stopMotion(true); publish(); schedule(); });
  listen(canvas, 'webglcontextlost', event => {
    event.preventDefault(); contextLost = true; solid = null; stopMotion(true); publish(); schedule();
  });
  listen(canvas, 'webglcontextrestored', () => { contextLost = false; solidFailed = false; schedule(); });
  const api = {
    setMode,
    setOrientation,
    setInputOptions,
    setView: (name, options = {}) => setView(name, options?.immediate !== true),
    reset: (options = {}) => setView('three', options?.immediate !== true),
    getState,
    destroy() {
      if (destroyed) return;
      destroyed = true; stopMotion();
      if (drag && host.hasPointerCapture?.(drag.id)) host.releasePointerCapture(drag.id);
      drag = null;
      for (const remove of listeners) remove();
      resizeObserver?.disconnect(); intersectionObserver?.disconnect(); solid?.destroy();
      root.remove(); host.style.touchAction = originalTouchAction;
      for (const [name, value] of originalAttributes) {
        if (value === null) host.removeAttribute(name);
        else host.setAttribute(name, value);
      }
      if (instances.get(host) === api) instances.delete(host);
    },
  };
  instances.set(host, api); publish(); measure();
  loadModel().then(model => {
    if (destroyed) return;
    aircraft = model; ascii = createAsciiRenderer(pre, model); distance = fitDistance(model, angles, width, height);
    ready = 'true'; status.hidden = true; status.textContent = ''; publish(); schedule();
  }).catch(() => {
    if (destroyed) return;
    ready = 'false'; renderer = 'text'; canvas.style.display = pre.style.display = 'none';
    status.hidden = false; status.textContent = '787 장면을 불러오지 못했습니다. 아래의 소개와 프로젝트는 계속 볼 수 있습니다.';
    publish();
  });
  return api;
}
