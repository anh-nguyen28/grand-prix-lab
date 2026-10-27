import { LIVERY_ACCENTS, LIVERY_FINISHES, LIVERY_HELMETS, LIVERY_PAINTS, LIVERY_PATTERNS, PLAYER_TEAMS, carNumber } from '../../shared/content.js';
import { escapeHtml as e, icon } from './icons.js';
import { teamLogo } from './team-logo.js';

// The showroom: a turntable on the left, livery controls on the right. Purely cosmetic choices.
export function renderShowroomShell() {
  return `<section id="showroom" class="showroom" role="dialog" aria-modal="true" aria-labelledby="showroom-title" hidden>
    <div class="showroom-stage"><div id="showroom-scene" class="showroom-scene"></div>
      <div class="showroom-plate"><span class="eyebrow">THE SHOWROOM · CAR <b id="showroom-number">07</b></span><strong id="showroom-driver">Your car</strong><span id="showroom-team-label" class="showroom-team-line"></span></div>
      <span class="showroom-watermark" id="showroom-watermark" aria-hidden="true">07</span>
      <span class="showroom-hint">${icon('eye')} DRAG TO SPIN · LOOKS ONLY, NO EFFECT ON PACE</span></div>
    <form id="showroom-form" class="showroom-panel" autocomplete="off"></form>
  </section>`;
}

const swatches = (key, label, options, value) => `<fieldset class="livery-group"><legend>${label}<span>${e(options.find(option => option.color === value)?.name ?? 'Custom')}</span></legend><div class="swatches">${options.map(option => `<button type="button" class="swatch ${option.color === value ? 'selected' : ''}" style="--swatch:${option.color}" data-action="livery" data-key="${key}" data-value="${option.color}" aria-label="${e(option.name)}" aria-pressed="${option.color === value}"></button>`).join('')}<label class="swatch custom ${options.some(option => option.color === value) ? '' : 'selected'}" style="--swatch:${value}" title="Pick any colour">${icon('palette')}<input type="color" data-livery-key="${key}" value="${value}" aria-label="Custom ${label.toLowerCase()} colour"></label></div></fieldset>`;
const choices = (key, label, options, value) => `<fieldset class="livery-group"><legend>${label}</legend><div class="livery-choices">${Object.entries(options).map(([id, option]) => `<button type="button" class="${id === value ? 'selected' : ''}" data-action="livery" data-key="${key}" data-value="${id}" aria-pressed="${id === value}" ${option.description ? `title="${e(option.description)}"` : ''}><i class="choice-chip ${key}-${id}"></i>${option.name}</button>`).join('')}</div></fieldset>`;

const teamPicker = team => `<fieldset class="livery-group"><legend>Team<span>${team.id === 'custom' ? 'Your own team' : e(team.name)}</span></legend><div class="team-choices">${Object.entries(PLAYER_TEAMS).map(([id, option]) => `<button type="button" class="${team.id === id ? 'selected' : ''}" data-action="team" data-team="${id}" aria-pressed="${team.id === id}">${teamLogo({ id, name: option.name }, null, 'team-badge')}<strong>${option.name}</strong><small>${option.base}</small></button>`).join('')}<button type="button" class="${team.id === 'custom' ? 'selected' : ''}" data-action="team" data-team="custom" aria-pressed="${team.id === 'custom'}"><i class="team-badge custom">+</i><strong>Your own team</strong><small>Name it, then paint it.</small></button></div>
    ${team.id === 'custom' ? `<label class="input-label team-name-label" for="showroom-team">Team name</label><input id="showroom-team" maxlength="24" value="${e(team.name)}" placeholder="e.g. Night Shift Racing">` : ''}</fieldset>`;

export function renderShowroomPanel(state, livery, name, firstVisit, team) {
  return `<div class="showroom-head"><span class="eyebrow">${firstVisit ? 'BEFORE YOU HIT THE GARAGE' : 'BACK IN THE SHOWROOM'}</span><h2 id="showroom-title">Make it yours.</h2><p>Join an F1 team, then make the colours, finish and race number your own. Your team badge rides on the car. Every rival will know this car on sight.</p></div>
    ${state.phase === 'practice' ? `<label class="input-label" for="showroom-name">Driver name</label><input id="showroom-name" name="name" maxlength="24" value="${e(name)}" placeholder="e.g. Alex Morgan">` : ''}
    ${teamPicker(team)}
    ${swatches('paint', 'Body paint', LIVERY_PAINTS, livery.paint)}
    ${choices('finish', 'Finish', LIVERY_FINISHES, livery.finish)}
    ${swatches('accent', 'Accent', LIVERY_ACCENTS, livery.accent)}
    ${choices('pattern', 'Livery', LIVERY_PATTERNS, livery.pattern)}
    ${swatches('helmet', 'Helmet', LIVERY_HELMETS, livery.helmet)}
    <fieldset class="livery-group"><legend>Race number</legend><div class="number-picker"><button type="button" class="icon-button" data-action="livery-number" data-step="-1" aria-label="Lower number">−</button><input type="number" id="showroom-number-input" min="1" max="99" value="${livery.number}" aria-label="Race number"><button type="button" class="icon-button" data-action="livery-number" data-step="1" aria-label="Higher number">+</button><span class="number-preview" aria-hidden="true">${carNumber(livery)}</span></div></fieldset>
    <div class="showroom-actions"><button type="button" class="button light" data-action="livery-random">${icon('shuffle')} Surprise me</button><button type="submit" class="button primary">Drive to the garage ${icon('arrow')}</button></div>`;
}
