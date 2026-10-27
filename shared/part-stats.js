// Condition stats, 0–100 (game values, not real F1 data). tests/parts.test.js ties the power and aero
// numbers to the ratings in shared/engineering.js so the two cannot drift apart.
export const PART_STATS = {
  // tyres: dry grip, wet grip, grip when cold, resistance to gritty surfaces, heat tolerance
  road: { dryGrip: 70, wetGrip: 15, warmup: 35, abrasion: 50, heatTol: 55 },
  soft: { dryGrip: 85, wetGrip: 20, warmup: 80, abrasion: 25, heatTol: 30 },
  medium: { dryGrip: 65, wetGrip: 35, warmup: 60, abrasion: 50, heatTol: 55 },
  offroad: { dryGrip: 55, wetGrip: 60, warmup: 50, abrasion: 75, heatTol: 60 },
  tracks: { dryGrip: 55, wetGrip: 50, warmup: 40, abrasion: 90, heatTol: 80 },
  paddle: { dryGrip: 35, wetGrip: 40, warmup: 45, abrasion: 70, heatTol: 55 },
  hard: { dryGrip: 50, wetGrip: 25, warmup: 20, abrasion: 95, heatTol: 85 },
  inter: { dryGrip: 45, wetGrip: 80, warmup: 55, abrasion: 40, heatTol: 35 },
  wet: { dryGrip: 25, wetGrip: 95, warmup: 50, abrasion: 30, heatTol: 20 },
  // power: output and cooling
  solar: { output: 48, cooling: 95 },
  battery: { output: 58, cooling: 88 },
  electric: { output: 70, cooling: 78 },
  sprint: { output: 100, cooling: 10 },
  turbo: { output: 88, cooling: 62 },
  torque: { output: 95, cooling: 35 },
  // aero: downforce, straight-line efficiency, stability over kerbs and bumps
  scout: { downforce: 35, straight: 95, stability: 30 },
  alloy: { downforce: 75, straight: 70, stability: 65 },
  carbon: { downforce: 95, straight: 48, stability: 70 },
  drs: { downforce: 78, straight: 80, stability: 60 },
  floor: { downforce: 90, straight: 76, stability: 40 },
  // chassis: stability and weight (weight lowers top speed and abrasion resistance)
  stiff: { stability: 25, weight: 3 },
  sprung: { stability: 60, weight: 10 },
  titanium: { stability: 85, weight: 4 },
  monocoque: { stability: 80, weight: 0 },
};
