# Orbit

## Design plan

A quiet, open night sky rather than a panel containing a graph. The name sits above a wide field of character stars. Record stars have a real destination; hovering or focusing one makes the relation within its project/activity group visible. A small 787 occupies the lower open sky. A short atmospheric fade brings the reader to a bright blue-gray reading surface without a long scroll performance.

- Palette: midnight `#0a123d`, blue hour `#273c70`, haze `#8296bd`, daylight `#edf2f8`, star `#d9e5ff`, text `#1c2e4c`.
- Type: self-hosted Noto Sans KR for names and reading. System monospace only for the literal ASCII star glyphs and aircraft.
- Layout: centered identity above an asymmetric open constellation; restrained CV and image-led pinned projects below. No enclosing sky panel, section cards, or numbered decorations.
- Hierarchy: 정지원, then Jiwon Jung and the small signature. CV precedes two pinned projects and the searchable full catalogue. Blog is a navigation destination, not a section.

```
                    정지원 / Jiwon Jung
                 Somewhere between code and stars.
       * 신성인                 + 모무
                          · 숭실대학교
        + PRON                        * IT지원위원회
                              [small ASCII 787]
             blue atmosphere fades into daylight
       CV                       actual activities
       pinned projects          full searchable catalogue
```

## Brief review

A permanently drawn chronology would reproduce Horizon. Orbit instead leaves stars free and reveals only the shared category on focus or hover. The 787 remains a small personal detail with a route into the flight lab. The transition is shallow so the page stays useful as a portfolio.

## Implementation

Uses shared public data and `sky-engine/viewer.mjs`. The constellation has no animation loop, no random content, and no invented employment or project associations. Graph connections mean shared project or activity categories. Native links and details work without JavaScript; project search appears only when active. The background glyphs are decorative and hidden from assistive technology.

## Visual and interaction review

| Before | After | Why |
| --- | --- | --- |
| Always-visible structural graph would dominate the open sky | Only the relevant category edge appears on hover or focus | Leaves stars floating while retaining the meaning of their relationship |
| Keyboard focus would inherit pointer opacity easing | Graph focus changes are immediate | Keeps repeated keyboard navigation direct |
| A separate blog section would lengthen the page | Blog links in the header and footer | Matches the requested navigation-only role |

Verified the integrated page in Chrome at 320, 390, 768, and 1440px. No horizontal overflow, record-star overlaps, broken images, or browser exceptions. Every record star has at least a 44px hit area. Viewed desktop/mobile full screenshots and the focused graph. Name remains primary, the 787 is visible without a panel, and the short transition exposes the reading surface at approximately 883–956px depending on width.

Twenty-four functional checks passed: category hover/focus, immediate keyboard graph state, destination fragment and focus, search/empty/reset/URL reload, explicit hidden-project reveal, direct project fragment, query-and-fragment coexistence, aircraft arrow/Home input, idle rendering stop after the pending frame settles, reduced motion, CV order, two pinned projects, and Blog navigation without a Blog section. Captures are local in `output/playwright/orbit-*`.
