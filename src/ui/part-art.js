import { PARTS } from '../../shared/content.js';
import { AERO_LOOKS, CHASSIS_LOOKS, PALETTE, POWER_LOOKS, SENSOR_LOOKS, TYRE_LOOKS } from './part-looks.js';

// Original vector illustrations, drawn from the same looks as the 3D car so the shelf matches what you fit.
const { paint, carbon, metal } = PALETTE;
const shadow = (cx, rx) => `<ellipse cx="${cx}" cy="128" rx="${rx}" ry="9" fill="#000" opacity=".3"/>`;
const glowRect = (x, y, w, h, color) => `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="5" fill="${color}" opacity=".25"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="#ffffff88"/>`;

function tyre(look) {
  const depth = 26 * look.width, accent = look.stripe;
  let tread = '';
  if (look.tread === 'grooves') tread = `<path d="m${100 + depth} 27 10 17 5 24-3 31m-1-67 10 20 3 22-3 19" stroke="#717b88" stroke-width="2" fill="none"/>`;
  if (look.tread === 'blocks') tread = Array.from({ length: 6 }, (_, i) => `<rect x="${96 + depth - 6 + i * 4}" y="${28 + i * 13}" width="${depth * .7}" height="7" rx="1.5" fill="#2a313d" stroke="#717b88"/>`).join('');
  if (look.tread === 'paddles') tread = Array.from({ length: 8 }, (_, i) => `<path d="M91 71 91 16" stroke="#2b2f37" stroke-width="8" transform="rotate(${i * 45} 91 71)"/>`).join('');
  return `${shadow(111, 58)}<path d="M72 31 ${100 + depth} 20Q${142 + depth} 25 ${145 + depth} 69L${143 + depth} 95 ${100 + depth} 117 69 105Z" fill="#11151d" stroke="#65738b" stroke-width="2"/>${look.tread === 'paddles' ? tread : ''}<ellipse cx="91" cy="71" rx="41" ry="49" fill="#202632" stroke="#738097" stroke-width="2"/><ellipse cx="91" cy="71" rx="33" ry="40" fill="none" stroke="${accent}" stroke-width="5"/><ellipse cx="91" cy="71" rx="23" ry="28" fill="#111722" stroke="#59687d" stroke-width="5"/>${Array.from({ length: 6 }, (_, i) => `<path d="M91 71 91 45" stroke="#a9b7cb" stroke-width="3" transform="rotate(${i * 60} 91 71)"/>`).join('')}<ellipse cx="91" cy="71" rx="7" ry="8" fill="#d1d9e4"/>${look.tread === 'paddles' ? '' : tread}`;
}

// Side view of the sidepod and engine cover: inlet size, cover height, vents and the unit's signature.
function powerUnit(look) {
  const inlet = Math.max(6, look.inlet * 90), cover = look.cover * 110, top = 78 - cover;
  let extra = '';
  if (look.extra === 'grille') extra = glowRect(56, 70, 70, 8, PALETTE.grille);
  if (look.extra === 'batteries') extra = glowRect(46, 66, 34, 14, PALETTE.battery) + glowRect(88, 66, 34, 14, PALETTE.battery);
  if (look.extra === 'snorkel') extra = `<rect x="104" y="${top - 46}" width="16" height="50" fill="${PALETTE.bronze}" stroke="#ffffff55"/><rect x="92" y="${top - 60}" width="34" height="18" rx="4" fill="${PALETTE.bronze}"/><ellipse cx="92" cy="${top - 51}" rx="4" ry="7" fill="${carbon}"/>`;
  if (look.extra === 'twinExhaust' || look.extra === 'heatStripes' || look.extra === 'snorkel') {
    const pipes = look.extra === 'twinExhaust' ? [86, 98] : [92];
    extra += pipes.map(y => `<rect x="176" y="${y - 5}" width="26" height="10" rx="3" fill="${metal}"/><circle cx="203" cy="${y}" r="5" fill="${look.extra === 'snorkel' ? '#3a4352' : PALETTE.heat}"/>${look.extra === 'snorkel' ? '' : `<circle cx="203" cy="${y}" r="9" fill="${PALETTE.heat}" opacity=".3"/>`}`).join('');
  }
  if (look.extra === 'twinExhaust') extra += glowRect(40, 96, 110, 5, PALETTE.heat);
  if (look.extra === 'heatStripes') extra += [96, 120, 144].map(x => glowRect(x, top + 6, 8, cover - 10, PALETTE.heat)).join('');
  const vents = Array.from({ length: look.vents }, (_, i) => `<path d="M${84 + i * 12} ${top + 8}v12" stroke="${carbon}" stroke-width="4"/>`).join('');
  return `${shadow(112, 82)}<path d="M28 82Q30 70 44 70H150L178 82V112Q176 118 168 118H36Q28 118 28 110Z" fill="${paint}" stroke="#ff9aa0" stroke-width="1.5"/><path d="M70 78Q74 ${top} 96 ${top}H150Q172 ${top} 178 82Z" fill="${paint}" stroke="#ff9aa0" stroke-width="1.5"/><rect x="28" y="${94 - inlet / 2}" width="16" height="${inlet}" rx="2" fill="${carbon}"/><path d="M48 104H160" stroke="${PALETTE.white}" stroke-width="2" opacity=".7"/>${vents}${extra}`;
}

// The rear wing from behind (width, height, planes, DRS flap) over the front-wing flaps.
function aero(look) {
  const half = look.width * 34, top = 62 - (look.height - 1.18) * 110, plate = look.accent || paint;
  const planes = Array.from({ length: look.elements - 1 }, (_, i) => {
    const y = top - 12 - i * 11 - (look.open ? 10 : 0), fill = i === look.elements - 2 && look.accent ? look.accent : carbon;
    return `<rect x="${110 - half + 6}" y="${y}" width="${half * 2 - 12}" height="7" rx="2" fill="${fill}" stroke="#a9b6c9" stroke-width=".8" ${look.open ? `transform="rotate(-4 110 ${y})"` : ''}/>`;
  }).join('');
  const floor = look.floor ? `<rect x="22" y="112" width="176" height="6" rx="2" fill="${carbon}"/><rect x="22" y="110" width="176" height="2" fill="${PALETTE.cyan}"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${78 + i * 15}" y="98" width="4" height="14" fill="${carbon}"/>`).join('')}` : '';
  const flaps = Array.from({ length: look.frontFlaps }, (_, i) => `<rect x="${40 + i * 8}" y="${124 - i * 6}" width="${140 - i * 16}" height="4" rx="1" fill="${i === look.frontFlaps - 1 && look.accent ? look.accent : paint}"/>`).join('');
  return `${shadow(110, 90)}<path d="M84 ${top + 12}V100M136 ${top + 12}V100" stroke="${carbon}" stroke-width="5"/><path d="M80 100H140L132 112H88Z" fill="${paint}"/>${planes}<rect x="${110 - half + 4}" y="${top}" width="${half * 2 - 8}" height="12" rx="3" fill="${paint}" stroke="#ff9aa0"/><rect x="${110 - half - 2}" y="${top - 14 - (look.elements - 1) * 11}" width="7" height="${40 + (look.elements - 1) * 11}" rx="2" fill="${plate}"/><rect x="${110 + half - 5}" y="${top - 14 - (look.elements - 1) * 11}" width="7" height="${40 + (look.elements - 1) * 11}" rx="2" fill="${plate}"/>${floor}<rect x="30" y="${126}" width="160" height="5" rx="2" fill="${carbon}"/>${flaps}`;
}

// The floor and suspension from above: stiffer parts get thicker arms.
function chassis(look) {
  const arm = 5 * look.arms;
  return `${shadow(110, 70)}<rect x="40" y="50" width="140" height="38" rx="10" fill="${look.tub}" stroke="#ffffff55"/>
    ${[56, 150].map(x => `<path d="M${x} 50 ${x - 22} 24M${x} 88 ${x - 22} 114" stroke="#c4ccd8" stroke-width="${arm}" stroke-linecap="round"/><rect x="${x - 34}" y="14" width="22" height="14" rx="4" fill="#11151d" stroke="#65738b"/><rect x="${x - 34}" y="110" width="22" height="14" rx="4" fill="#11151d" stroke="#65738b"/>`).join('')}
    ${look.accent ? `<rect x="52" y="66" width="116" height="5" rx="2" fill="${look.accent}"/>` : ''}`;
}

// The sensor pod on its mast above a red roll hoop.
function sensor(id) {
  const look = SENSOR_LOOKS[id];
  const hoop = `<path d="M70 128Q72 100 110 96Q148 100 150 128Z" fill="${paint}" stroke="#ff9aa0"/><rect x="107" y="${id === 'radar' ? 58 : 62}" width="6" height="40" fill="${metal}"/>`;
  if (id === 'camera') return `${shadow(110, 52)}${hoop}<rect x="80" y="34" width="60" height="34" rx="7" fill="${look.body}" stroke="#4a5568"/><circle cx="142" cy="51" r="17" fill="${look.lens}" opacity=".3"/><circle cx="142" cy="51" r="12" fill="${look.lens}" stroke="#d7f8ff" stroke-width="2"/>`;
  if (id === 'thermal') return `${shadow(110, 52)}${hoop}<rect x="78" y="32" width="64" height="38" rx="7" fill="${look.body}"/><circle cx="144" cy="51" r="17" fill="${look.lens}" opacity=".3"/><circle cx="144" cy="51" r="12" fill="${look.lens}" stroke="#ffd0c8" stroke-width="2"/>${[88, 104, 120].map(x => `<rect x="${x}" y="22" width="10" height="10" fill="${carbon}"/>`).join('')}`;
  if (id === 'radar') return `${shadow(110, 52)}${hoop}<ellipse cx="110" cy="44" rx="48" ry="16" fill="${look.body}" stroke="#ffffff88" transform="rotate(-18 110 44)"/><ellipse cx="110" cy="44" rx="30" ry="9" fill="#a9a5e8" transform="rotate(-18 110 44)"/><path d="M110 44 128 18" stroke="${metal}" stroke-width="3"/><circle cx="128" cy="18" r="4" fill="${metal}"/>`;
  return `${shadow(110, 52)}${hoop}<path d="M84 34Q84 14 110 14Q136 14 136 34Z" fill="${look.body}" stroke="#4a5568"/><rect x="84" y="34" width="52" height="30" fill="${look.body}" stroke="#4a5568"/><rect x="80" y="40" width="60" height="9" rx="2" fill="${look.ring}" opacity=".3"/><rect x="84" y="42" width="52" height="5" fill="${look.ring}"/><path d="M138 44h40M138 44l34-16M138 44l34 16" stroke="${look.ring}" opacity=".5"/>`;
}

export function partArt(id) {
  const part = PARTS[id];
  const art = part.slot === 'wheels' ? tyre(TYRE_LOOKS[id]) : part.slot === 'power' ? powerUnit(POWER_LOOKS[id]) : part.slot === 'body' ? aero(AERO_LOOKS[id]) : part.slot === 'chassis' ? chassis(CHASSIS_LOOKS[id]) : sensor(id);
  return `<svg class="part-art" viewBox="0 0 220 145" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${art}</svg>`;
}
