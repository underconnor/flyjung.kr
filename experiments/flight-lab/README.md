# 787 motion lab

An independent local experiment at `/flight-lab/`. It keeps all existing concepts and the public site intact. The page renders with `renderConcept()` and the shared `renderConceptNavigation('flight-lab')` navigation. The parent builder provides `/flight-lab.css`, `/flight-lab.js`, the shared navigation assets, and the sky-engine/v2 aircraft modules.

## Design

Dark indigo, pale aircraft characters, a large unframed scene, and one settings column. The actual controls provide the visual structure. There is no autoplay, decorative particle loop, telemetry, or fictional aviation profile. The desktop scene stays visible during a real page-scroll test; mobile places the scene above the settings.

The `frontend-design` and `emil-design-eng` guidance informs the restrained layout, immediate keyboard actions, short viewpoint transitions, interruptible direct manipulation, and complete idle stop. The parent user explicitly requested the separate lab and configurable input combinations. On mobile, a compact sticky preview remains above the settings; native scroll padding keeps focused controls visible. Orientation details stay in the desktop preview, while mobile gesture instructions sit with the input controls.

## Controls

- Drag, native page scroll, and mouse position can be combined or disabled independently.
- Axis can be horizontal, vertical, or both. Touch keeps native vertical page scrolling, so touch dragging only supplies the horizontal component.
- Orbit changes azimuth/elevation. Bank adds screen-space roll with a smaller heading change; it is an expressive graphic, not a flight simulator.
- Sensitivity ranges from 0.25 to 2.5. Inertia ranges from 0 to 1 and ends within 900ms.
- Motion policy defaults to system. Always reduce removes interpolation/inertia. Always full is an explicit user override, including when restored from a deliberately shared URL.
- ASCII/solid, three-quarter/side/top, view reset, all-inputs-off, and all-settings reset remain keyboard accessible.

## Shared links

Supported query keys: `drag`, `scroll`, `pointer`, `axis`, `type`, `sensitivity`, `inertia`, `motion`, `mode`, `view`, and `az`/`el`/`roll` for custom orientation. Invalid values fall back to defaults with a visible explanation. Updates use debounced `history.replaceState` rather than creating a history entry for every motion. `popstate` restores settings; sharing flushes pending updates. Defaults produce a clean URL. Clipboard success is reported only after `writeText` succeeds, otherwise the URL is shown in a selectable field.

No settings are sent to a backend. URL sharing is explicit. No deployment, build, Git operation, or existing page modification is part of this experiment.

## Verification

Actual isolated Chrome checks cover native scroll, pointer return, bank/axis settings, idle rendering, WebGL, keyboard-immediate viewpoints, URL restoration, malformed values, clipboard rejection fallback, and reset. Layouts at 320, 390, 768, and 1440 pixels do not overflow. At 320×568 and 390×844, a settings control remains clickable while the compact scene is visible. These are browser checks, not physical-device touch tests.
