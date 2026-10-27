import { BUDGET, DEFAULT_BUILD, MAX_CHANGED_SLOTS, PARTS, PRACTICE_RUNS, SLOTS, cleanLivery, cleanTeam, rivalsFor } from './content.js';
import { DEFAULT_TRACK_ID, TRACKS, trackById } from './tracks.js';
import { buildStats, racePoints, simulate } from './simulation.js';
import { addPlayerBoost, createRace, finishRace } from './race.js';

// A new round can start from a previous car, so players can apply what the last race taught them.
function startingBuild(build) {
  const valid = build && SLOTS.every(slot => PARTS[build[slot]]?.slot === slot) && buildStats(build).cost <= BUDGET;
  return valid ? Object.fromEntries(SLOTS.map(slot => [slot, build[slot]])) : { ...DEFAULT_BUILD };
}
export function createGame(profile = { name: 'You', mode: 'solo' }, build = null, trackId = DEFAULT_TRACK_ID) {
  return {
    version: 1, phase: 'practice', trackId: TRACKS.some(track => track.id === trackId) ? trackId : DEFAULT_TRACK_ID, profile: { ...profile, livery: cleanLivery(profile.livery), team: cleanTeam(profile.team) }, build: startingBuild(build),
    clues: [], sensorLocked: false, prediction: null, predictionLocked: false,
    runs: [], qualifying: null, qualifyingBuild: null, field: [], race: null, score: null,
  };
}
export function changedSlots(state, build = state.build) {
  return state.qualifyingBuild ? SLOTS.filter(slot => build[slot] !== state.qualifyingBuild[slot]) : [];
}
function reject(message) { return { ok: false, message }; }

// Intent in, validated state out. No DOM, network, clocks, or browser storage.
export function transition(previous, command) {
  const state = structuredClone(previous);
  const editable = ['practice', 'adjust'].includes(state.phase);
  switch (command.type) {
    case 'SET_PROFILE': {
      if (state.phase !== 'practice') return reject('Finish this round before starting a new garage.');
      const name = String(command.name ?? '').trim().slice(0, 24);
      if (!name) return reject('Give your garage a name first.');
      state.profile = { ...state.profile, name, mode: command.mode === 'team' ? 'team' : 'solo' };
      break;
    }
    case 'SELECT_TRACK': {
      if (state.phase !== 'practice') return reject('Finish this round before choosing another track.');
      if (!TRACKS.some(track => track.id === command.id)) return reject('That track is not on the calendar.');
      state.trackId = command.id;
      Object.assign(state, { clues: [], sensorLocked: false, prediction: null, predictionLocked: false, runs: [] });
      break;
    }
    case 'SET_LIVERY':
      if (state.phase === 'race') return reject('Your livery is locked while the race is running.');
      state.profile.livery = cleanLivery(command.livery);
      break;
    case 'SET_TEAM':
      if (state.phase === 'race') return reject('You cannot switch teams while the race is running.');
      if (command.team?.id === 'custom' && !String(command.team.name ?? '').trim()) return reject('Give your team a name first.');
      state.profile.team = cleanTeam(command.team);
      break;
    case 'SET_PART': {
      if (!editable) return reject('Your build is locked for this run.');
      const part = PARTS[command.id];
      if (!part) return reject('That part is not in this garage.');
      if (part.slot === 'sensor' && state.sensorLocked) return reject('Your sensor stays fitted after the first scan.');
      const build = { ...state.build, [part.slot]: part.id };
      if (buildStats(build).cost > BUDGET) return reject(`That combination costs more than ${BUDGET} credits. Try a cheaper part.`);
      if (state.phase === 'adjust' && changedSlots(state, build).length > MAX_CHANGED_SLOTS) return reject('You can change two slots after qualifying. Revert a changed slot first.');
      state.build = build;
      break;
    }
    case 'SCAN':
      if (state.phase !== 'practice') return reject('Field research closes after practice.');
      if (state.clues.length >= 3) return reject('You have collected all three observations.');
      state.sensorLocked = true;
      state.clues.push(trackById(state.trackId).mystery.clues[state.build.sensor][state.clues.length]);
      break;
    case 'PREDICT': {
      const mystery = trackById(state.trackId).mystery;
      if (state.phase !== 'practice' || state.predictionLocked) return reject('Your prediction is locked.');
      if (!mystery.options.includes(command.terrain)) return reject(`Choose ${mystery.options.join(', ')}.`);
      state.prediction = command.terrain;
      state.predictionLocked = true;
      break;
    }
    case 'PRACTICE':
      if (state.phase !== 'practice') return reject('Practice has finished.');
      if (state.runs.length >= PRACTICE_RUNS) return reject('Both practice runs are used. You can still change your build.');
      state.predictionLocked = true;
      state.runs.push(simulate(state.build, trackById(state.trackId)));
      break;
    case 'QUALIFY':
      if (state.phase !== 'practice') return reject('This qualifying run is already locked.');
      state.predictionLocked = true;
      state.sensorLocked = true;
      state.qualifyingBuild = { ...state.build };
      state.qualifying = simulate(state.build, trackById(state.trackId));
      state.phase = 'qualifying';
      break;
    case 'FINISH_QUALIFY':
      if (state.phase !== 'qualifying') return reject('There is no qualifying run in progress.');
      state.phase = 'adjust';
      break;
    case 'RACE': {
      if (state.phase !== 'adjust') return reject('Complete qualifying before entering the race.');
      state.race = createRace([{ id: 'you', name: state.profile.name, team: state.profile.team.name, teamId: state.profile.team.id, color: state.profile.livery.paint, build: state.build }, ...rivalsFor(state.trackId)], state.qualifyingBuild, trackById(state.trackId));
      state.phase = 'race';
      break;
    }
    case 'BOOST': {
      if (state.phase !== 'race') return reject('ERS is only available during the race.');
      const result = addPlayerBoost(state.race, command.elapsed);
      if (!result.ok) return reject(result.message);
      state.race = result.race;
      break;
    }
    case 'REVEAL': {
      if (state.phase !== 'race') return reject('Race results are not ready.');
      state.field = finishRace(state.race);
      const player = state.field.find(entry => entry.id === 'you');
      const bonus = state.prediction === trackById(state.trackId).mystery.target ? 3 : 0;
      state.score = { race: player.retired?0:racePoints(player.place), prediction: bonus, total: (player.retired?0:racePoints(player.place)) + bonus, place: player.place };
      state.phase = 'results';
      break;
    }
    default: return reject('Unknown game action.');
  }
  return { ok: true, state };
}
