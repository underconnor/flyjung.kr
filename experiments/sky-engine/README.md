# Shared 787 scene

New concepts can embed the same aircraft in their composition without an extra panel, background, toolbar, decorative dots, or automatic animation. Existing concepts are unchanged.

```js
import { createSkyViewer } from '/sky-engine/viewer.mjs';

const host = document.querySelector('.aircraft-scene');
const viewer = createSkyViewer(host, { mode: 'ascii', interactive: true });
viewer.setMode('solid');
viewer.setView('side');
viewer.reset();
// When removing the scene:
// viewer.destroy();
```

The host supplies a width and height (or an aspect ratio) and a foreground `color`, normally pale indigo on a dark indigo section. A host with no height receives a 280px fallback height. The engine adds only scoped child styles. ASCII inherits the host color; both modes have a transparent background. Keep a visible focus style on the host. The parent page owns external mode/view controls and their labels.

The API returns synchronously. Geometry loads asynchronously from `/aircraft-v2/model.mjs` and uses its `createAircraft()` positions, normals, colors, and bounds. The model must use +X for the nose, +Y for up, and ±Z for the wings. It is a stylized 787-inspired scene, not a technical model or a claim of aviation employment.

## API and state

- `setMode('ascii' | 'solid')`: switch rendering while preserving the camera. Returns false for invalid input or a destroyed viewer.
- `setView('three' | 'side' | 'top', {immediate: false})`: select a fitted camera in 240ms. Use `immediate: true` for keyboard-triggered controls. Invalid/prototype names are rejected.
- `reset({immediate: false})`: restore the three-quarter camera, retaining the current rendering mode and input settings.
- `setOrientation({azimuth, elevation, roll, immediate: false, preserveInput: false})`: set one or more finite camera angles in radians. Elevation is clamped to −1.35…1.55 and roll to −0.8…0.8. `preserveInput: true` applies the change from the last external reference to the current camera, keeping manual drag offsets. Use `immediate: true` when driving this every scroll frame. Preset/reset calls establish a new reference; the initial reference is `{azimuth: .52, elevation: .62, roll: 0}`.
- `setInputOptions(patch)`: merge validated input settings from the table below. Invalid/unknown properties return false without applying the patch. `interactive: false` cannot be used to enable interaction later.
- `getState()`: return `{ready, mode, view, renderer, animating, dragging, azimuth, elevation, roll, inputOptions, reducedMotion, renderCount}`. Angles include the temporary pointer-follow offset.
- `destroy()`: remove owned DOM, listeners, observers, animation frames, and GPU resources; restore the host attributes/touch behavior. Calling it repeatedly is safe. Mounting again on a host destroys its previous viewer first.

The host emits `skyviewerchange` with `event.detail = viewer.getState()` when readiness, mode, view, rendering availability, or animation state changes. External buttons can synchronize `aria-pressed` from this event. Dragging or arrow keys set `view` to `custom`.

The same state is exposed as `data-ready="loading|true|false"`, `data-mode="ascii|solid"`, `data-view="three|side|top|custom"`, `data-renderer="text|ascii|webgl|ascii-fallback"`, and `data-animating`. `data-render-count`, `data-azimuth`, `data-elevation`, and `data-roll` help verify rendering and idle behavior. Requested `mode=solid` stays selected if WebGL fails; `renderer=ascii-fallback` and a visible explanation identify the actual renderer.

## Interaction and rendering

Mouse dragging rotates in two axes. Touch dragging rotates horizontally; vertical scrolling and pinch zoom remain native (`pan-y pinch-zoom`). Additional pointers are ignored. Arrow keys rotate immediately; Home resets immediately. Wheel events are never captured. The default drag release decays for at most 600ms; configurable inertia is capped at 900ms. System reduced-motion preferences remove interpolation and inertia unless the user explicitly selects full motion. Pointer following uses a brief 140ms settling motion. Passive page-scroll input changes orientation without preventing scrolling.

Both modes share the same perspective camera and actual triangle geometry. ASCII uses a CPU triangle/depth rasterizer with no decorative background characters. Solid uses native WebGL with depth and lighting. Camera fitting uses real vertices when resizing or selecting a preset. During manual rotation, the camera widens only if necessary to keep a wing in frame, and does not zoom back in on release. Rendering stops after interaction, when the tab is hidden, or when the scene leaves the viewport. Solid pixels are capped at device pixel ratio 2. No runtime dependencies or network CDN are used.

When WebGL is unavailable or its context is lost, the same model remains available as ASCII with an explicit explanation. A restored context returns the requested solid mode. A missing/invalid model produces a readable status instead of a broken control or an uncaught import rejection.


## Input settings

Pass these as `inputOptions` to `createSkyViewer`, or update them with `setInputOptions`:

| Setting | Default | Accepted values |
| --- | --- | --- |
| `drag` | `true` | Boolean |
| `scroll` | `false` | Boolean; passive page scroll |
| `pointer` | `false` | Boolean; mouse position within the host |
| `axis` | `'both'` | `'both'`, `'horizontal'`, `'vertical'` |
| `type` | `'orbit'` | `'orbit'`, `'bank'` (smaller yaw plus screen roll) |
| `sensitivity` | `1` | Finite number from 0.25 to 2.5 |
| `inertia` | `0.5` | Finite number from 0 to 1; 0 disables release motion |
| `reducedMotion` | `'system'` | `'system'`, `'reduce'`, `'full'`; full is an explicit user choice |

The three inputs combine independently. Turning all off leaves explicit view buttons and keyboard arrows available. Touch remains horizontal-only even when the selected axis includes vertical input; vertical gestures continue to scroll the page. Pointer offsets are temporary and settle back when the pointer leaves the host. No input creates an indefinite animation loop. These settings can be compared at `/flight-lab/`.

## Design decisions

The motion follows the `emil-design-eng` interaction guidance: motion explains a viewpoint change, keyboard actions stay immediate, gestures can interrupt transitions, and there is no idle loop. The scene is intended to sit inside the page's typography and content hierarchy; it does not add standalone model-viewer chrome.
