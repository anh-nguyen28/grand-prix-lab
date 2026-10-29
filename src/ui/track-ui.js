import { CONDITIONS } from '../../shared/conditions.js';
import { INCIDENTS, latestTest, sectionReport, sensorSees } from '../../shared/engineering.js';
import { trackById } from '../../shared/tracks.js';
import { escapeHtml as e } from './icons.js';

const STAT_LABELS = { dryGrip: 'Dry grip', wetGrip: 'Wet grip', warmup: 'Tyre warm-up', abrasion: 'Grit resistance', heatTol: 'Heat tolerance', downforce: 'Downforce', topSpeed: 'Top speed', cooling: 'Cooling', stability: 'Stability' };
const PILL = { clean: 'CLEAN', slow: 'SLOWER', crash: 'CRASH RISK', fire: 'FIRE RISK' };

// Per section: how the car scores against the baseline, the weakest stat and what to try.
export function renderSectionForecast(state) {
  const track = trackById(state.trackId), test = latestTest(state), sensor = state.build.sensor;
  const trouble = { incident: outcome => outcome.type, crash: () => 'crash', fire: () => 'fire' };
  return `<div class="section-forecast"><span class="eyebrow">SECTIONS</span>${sectionReport(test.build, track).map(({ section, outcome, weakStat }) => {
    const unseen = trouble[outcome.kind] && !sensorSees(sensor, trouble[outcome.kind](outcome));
    const pill = unseen ? 'NOT SEEN' : outcome.kind === 'incident' ? e(INCIDENTS[outcome.type]?.label ?? 'INCIDENT') : PILL[outcome.kind];
    const note = unseen ? 'Sensor cannot read this' : outcome.kind === 'clean' ? '' : `Weakest: ${STAT_LABELS[weakStat]}`;
    return `<div class="forecast-row is-${unseen ? 'unseen' : outcome.kind}"><div><strong>${e(section.name)}</strong><small>${CONDITIONS[section.condition].label}${note ? ` · ${note}` : ''}</small></div><span class="pill">${pill}</span></div>`;
  }).join('')}</div>`;
}
