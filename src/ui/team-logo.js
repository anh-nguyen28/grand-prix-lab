import { DEFAULT_LIVERY, PLAYER_TEAMS, teamCode } from '../../shared/content.js';
import { escapeHtml as e } from './icons.js';

// Team logos are optional files in public/team-logos/<id>.svg or .png. Without one, a team
// shows an original monogram badge in its colours. Lookups are cached per team.
const logos = new Map();
export function loadTeamLogo(id) {
  if (!logos.has(id)) logos.set(id, new Promise(resolve => {
    const tryNext = ([extension, ...rest]) => {
      if (!extension) { resolve(null); return; }
      const image = new Image();
      image.onload = () => resolve(image); image.onerror = () => tryNext(rest);
      image.src = `${import.meta.env.BASE_URL}team-logos/${id}.${extension}`;
    };
    tryNext(['svg', 'png']);
  }).then(image => { logos.set(id, image); return image; }));
  const value = logos.get(id);
  return value instanceof Promise ? value : Promise.resolve(value);
}
const loadedLogo = id => { const value = logos.get(id); return value instanceof Promise ? null : value; };
export const teamColors = (team, livery) => PLAYER_TEAMS[team.id]?.livery ?? livery ?? DEFAULT_LIVERY;

export function teamLogo(team, livery, cls = '') {
  const image = loadedLogo(team.id), colors = teamColors(team, livery);
  if (image) return `<span class="team-logo has-image ${cls}" title="${e(team.name)}" role="img" aria-label="${e(team.name)}"><img src="${e(image.src)}" alt=""></span>`;
  return `<span class="team-logo ${cls}" style="--team-paint:${colors.paint};--team-accent:${colors.accent};--team-ink:${contrast(colors.paint)}" title="${e(team.name)}" role="img" aria-label="${e(team.name)}"><b>${e(teamCode(team))}</b></span>`;
}

// Draws the badge onto a canvas for the car's decals, and upgrades it once a logo file loads.
export function drawTeamLogo(canvas, team, livery, onUpdate) {
  const ctx = canvas.getContext('2d'), { width: w, height: h } = canvas, colors = teamColors(team, livery);
  const paint = image => {
    ctx.clearRect(0, 0, w, h);
    if (image) { const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight) * .9, iw = image.naturalWidth * scale, ih = image.naturalHeight * scale; ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih); return; }
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.transform(1, 0, -.18, 1, 0, 0);
    const bw = w * .86, bh = h * .78;
    ctx.fillStyle = colors.accent; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, h * .14); ctx.fill();
    ctx.fillStyle = colors.paint; roundRect(ctx, -bw / 2 + h * .07, -bh / 2 + h * .07, bw - h * .14, bh - h * .14, h * .09); ctx.fill();
    ctx.fillStyle = contrast(colors.paint); ctx.font = `italic 900 ${h * .42}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(teamCode(team), 0, h * .02, bw * .8);
    ctx.restore();
  };
  paint(loadedLogo(team.id));
  loadTeamLogo(team.id).then(image => { if (image) { paint(image); onUpdate?.(); } });
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function contrast(hex) { const n = parseInt(hex.slice(1), 16), l = .299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255); return l > 160 ? '#11151c' : '#ffffff'; }
