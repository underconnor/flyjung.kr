/**
 * A right-facing duck drawn as a constellation, independent of the aircraft.
 * Coordinates use a 4:3 area: x grows right; y grows down. r is star weight.
 * Keep that aspect ratio when fitting the points into a canvas.
 */
export const duckConstellation = {
  id: 'duck',
  name: '오리 별자리',
  aspectRatio: 4 / 3,
  points: [
    // Silhouette, clockwise from the upper base of the bill.
    { x: 0.804, y: 0.276, r: 1.0 }, // 0 · bill / forehead
    { x: 0.924, y: 0.289, r: 0.85 },
    { x: 0.947, y: 0.334, r: 1.15 },
    { x: 0.817, y: 0.357, r: 0.9 },
    { x: 0.759, y: 0.398, r: 1.0 }, // 4 · chin
    { x: 0.737, y: 0.481, r: 0.85 },
    { x: 0.781, y: 0.602, r: 1.3 }, // 6 · breast
    { x: 0.736, y: 0.735, r: 1.0 },
    { x: 0.595, y: 0.818, r: 1.1 },
    { x: 0.400, y: 0.833, r: 1.25 }, // 9 · belly
    { x: 0.245, y: 0.770, r: 0.9 },
    { x: 0.177, y: 0.666, r: 0.85 },
    { x: 0.082, y: 0.510, r: 1.3 }, // 12 · raised tail
    { x: 0.261, y: 0.564, r: 0.9 },
    { x: 0.397, y: 0.503, r: 1.0 },
    { x: 0.532, y: 0.485, r: 0.9 }, // 15 · shoulder
    { x: 0.596, y: 0.400, r: 1.0 },
    { x: 0.560, y: 0.300, r: 1.05 },
    { x: 0.598, y: 0.193, r: 1.1 },
    { x: 0.705, y: 0.145, r: 1.3 }, // 19 · round head
    { x: 0.782, y: 0.187, r: 0.95 },

    // The eye is deliberately isolated so the face stays readable.
    { x: 0.733, y: 0.264, r: 1.65 }, // 21 · eye

    // Folded wing: a separate, broad teardrop inside the body.
    { x: 0.323, y: 0.616, r: 0.95 }, // 22
    { x: 0.434, y: 0.568, r: 0.8 },
    { x: 0.558, y: 0.604, r: 1.05 },
    { x: 0.611, y: 0.674, r: 0.8 },
    { x: 0.534, y: 0.734, r: 0.9 },
    { x: 0.415, y: 0.736, r: 0.8 },
    { x: 0.322, y: 0.686, r: 0.85 }, // 28
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
    [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
    [19, 20], [20, 0],
    [22, 23], [23, 24], [24, 25], [25, 26], [26, 27], [27, 28],
    [28, 22],
  ],
  groups: {
    silhouette: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    eye: [21],
    wing: [22, 23, 24, 25, 26, 27, 28],
  },
};

export default duckConstellation;
