import { trackById, trackZone } from '../../shared/tracks.js';
import { escapeHtml as e } from './icons.js';

// A loading screen in the middle of the race view while your car loses time: what happened, and a bar
// with the seconds lost counting up.
export function renderIncidentPage(race, event, earlierLaps) {
  const fire = event.type === 'fire', zone = trackZone(trackById(race.trackId), event.distance).name;
  const repeat = earlierLaps.length ? `<p class="incident-page-repeat">Also on lap ${earlierLaps.join(' and ')}</p>` : '';
  return `<div class="incident-page-inner">
    <p class="incident-page-meta"><i class="incident-flag" aria-hidden="true"></i>Your car · Lap ${event.lap} · ${e(zone)}</p>
    <h2 id="incident-page-title">${e(event.title)}</h2>
    <p>${e(event.cause)}</p>${repeat}
    <div class="incident-bar" role="progressbar" aria-label="${fire ? 'Car stopping' : 'Time lost'}" aria-valuemin="0" aria-valuemax="100"><i></i></div>
    <div class="incident-page-time"><span aria-hidden="true"></span><strong class="incident-page-cost">${fire ? 'OUT' : '+0.0s'}</strong></div>
    <button class="incident-page-continue" data-action="incident-continue">Continue <kbd>Esc</kbd></button>
  </div>`;
}

export function loadingText(event, share) {
  if (event.type === 'fire') return share < 1 ? 'Stopping the car' : 'Retired from the race';
  return share < 1 ? `Losing time · ${event.loss.toFixed(1)}s in total` : 'Back racing';
}
export const costText = (event, share) => event.type === 'fire' ? 'OUT' : `+${(event.loss * share).toFixed(1)}s`;
