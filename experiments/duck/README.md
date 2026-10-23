# Duck constellation

`constellation.mjs` exports `duckConstellation` (named and default), an original
29-star, right-facing duck constellation. It is separate from the 787 geometry.
The outline includes a flat bill, round head, short neck, broad body and raised
tail; a separate inner loop marks its folded wing. The brighter isolated star
at index 21 is its eye.

## Data

- `points`: `{ x, y, r }`, with normalized coordinates in `[0, 1]`. The origin
  is the top left and positive y points down.
- `r`: relative star size/brightness, **not** a normalized coordinate radius.
  A base radius of 1.5–2 CSS pixels works at 400 × 300.
- `edges`: pairs of point indices, with no duplicated or zero-length edges.
- `aspectRatio`: `4 / 3`. Fit a centered 4:3 rectangle inside the available
  canvas area, then map x and y into that rectangle to preserve the silhouette.
- `groups`: `silhouette`, `eye`, and `wing` point indices for optional animation.

There are 28 edges. Keep the eye unconnected and the lines lighter than the
stars. The silhouette is legible around 400 × 300; at smaller sizes, retain the
outline and eye before adding background stars near it. Apply device pixel
ratio to the canvas backing resolution, not these normalized coordinates.

The module contains only geometry data and needs no DOM, images, packages,
network requests, or external assets.
