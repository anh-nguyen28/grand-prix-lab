import { CONDITIONS } from '../../shared/conditions.js';
import { INCIDENTS, sectionReport } from '../../shared/engineering.js';
import { SLOT_LABELS } from '../../shared/content.js';
import { trackById } from '../../shared/tracks.js';
import { escapeHtml as e } from './icons.js';

const STAT_LABELS = { dryGrip: 'Dry grip', wetGrip: 'Wet grip', warmup: 'Tyre warm-up', abrasion: 'Grit resistance', heatTol: 'Heat tolerance', downforce: 'Downforce', topSpeed: 'Top speed', cooling: 'Cooling', stability: 'Stability' };
const PILL = { clean: 'CLEAN', slow: 'SLOWER', crash: 'CRASH RISK', fire: 'FIRE RISK' };

// One chip per section: its condition and, once you have run the car, whether it gets through.
export function renderTrackStrip(state) {
  const track = trackById(state.trackId), report = sectionReport(state.build, track), tested = state.runs.length > 0 || !!state.qualifying;
  return `<div class="track-strip" aria-label="Track sections">${report.map(({ section, outcome }, index) => `
    <div class="track-chip cond-${section.condition} ${tested ? `is-${outcome.kind}` : ''}"><span class="eyebrow">${String(index + 1).padStart(2, '0')} · ${CONDITIONS[section.condition].label.toUpperCase()}</span>
    <strong>${e(section.name)}</strong><small>${e(CONDITIONS[section.condition].blurb)}</small></div>`).join('')}</div>`;
}

// Per section: how the car scores against the baseline, the weakest stat and what to try.
export function renderSectionForecast(state) {
  const track = trackById(state.trackId);
  return `<div class="section-forecast"><span class="eyebrow">SECTION FORECAST</span>${sectionReport(state.build, track).map(({ section, outcome, weakStat, advice }) => `
    <div class="forecast-row is-${outcome.kind}"><div><strong>${e(section.name)}</strong><small>${CONDITIONS[section.condition].label} · needs ${Math.round(section.required)} · you score ${Math.round(outcome.score)}</small></div>
    <span class="pill">${outcome.kind === 'incident' ? e(INCIDENTS[outcome.type]?.label ?? 'INCIDENT') : PILL[outcome.kind]}</span>
    ${outcome.kind === 'clean' ? '' : `<p>${e(section.suggestion)} Weakest: ${STAT_LABELS[weakStat]}. ${advice.length ? `Try ${advice.map(item => `${e(item.name)} (${SLOT_LABELS[item.slot]}, ${item.cost >= 0 ? '+' : ''}${item.cost} cr)`).join(', ')}.` : 'No single swap fixes this within budget.'}</p>`}</div>`).join('')}</div>`;
}
