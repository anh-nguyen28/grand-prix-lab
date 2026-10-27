// One description of how every part looks. The 3D car (src/scene/racecar.js) and the shelf
// illustrations (src/ui/part-art.js) both draw from it, so they always match.
export const PALETTE = {
  paint: '#ef3038', carbon: '#151921', metal: '#98a4b5', white: '#f2f5fb',
  grille: '#79b8f8', battery: '#3fa9ff', bronze: '#e0a050', heat: '#ff6a1f', cyan: '#35e0ff',
};

export const TYRE_LOOKS = {
  road: { stripe: '#ef4348', width: 1, tread: 'smooth' },
  soft: { stripe: '#c86bff', width: 1.18, tread: 'smooth' },
  medium: { stripe: '#58c472', width: 1, tread: 'smooth' },
  offroad: { stripe: '#ffe168', width: 1.05, tread: 'grooves' },
  tracks: { stripe: '#ebeff6', width: 1.12, tread: 'blocks' },
  paddle: { stripe: '#ff9a3d', width: 1.1, tread: 'paddles' },
};

// inlet: sidepod opening height; cover: engine cover height; extra: the unit's visible signature.
export const POWER_LOOKS = {
  solar: { inlet: .4, cover: .27, vents: 7, extra: 'grille' },
  battery: { inlet: .32, cover: .32, vents: 4, extra: 'batteries' },
  electric: { inlet: .28, cover: .4, vents: 5, extra: null },
  turbo: { inlet: .24, cover: .46, vents: 3, extra: 'snorkel' },
  torque: { inlet: .17, cover: .53, vents: 2, extra: 'twinExhaust' },
  sprint: { inlet: .08, cover: .53, vents: 0, extra: 'heatStripes' },
};

// width/height: rear wing; elements: stacked planes; frontFlaps: front-wing flaps; accent colours the DRS parts.
export const AERO_LOOKS = {
  scout: { width: 1.75, elements: 1, height: 1.22, frontFlaps: 1, accent: null },
  alloy: { width: 2.45, elements: 2, height: 1.35, frontFlaps: 1, accent: null },
  carbon: { width: 2.85, elements: 3, height: 1.42, frontFlaps: 3, accent: null },
  drs: { width: 2.55, elements: 2, height: 1.38, frontFlaps: 2, accent: PALETTE.cyan, open: true },
  floor: { width: 2.1, elements: 1, height: 1.18, frontFlaps: 1, accent: null, floor: true },
};

export const SENSOR_LOOKS = {
  camera: { body: PALETTE.carbon, lens: '#62b9e1' },
  thermal: { body: '#ff8a4f', lens: '#ff3b4f' },
  radar: { body: '#c9c6ff' },
  lidar: { body: '#1c2433', ring: PALETTE.cyan },
};
