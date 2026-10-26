import { createGame, transition } from '../../shared/game.js';

// Replace this adapter with a WebSocket adapter for the multiplayer build.
// Views only consume snapshots and send commands; they never award points.
export function createLocalSession() {
  const listeners = new Set();
  let state = createGame();
  return {
    getSnapshot: () => structuredClone(state),
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(command) {
      const result = transition(state, command);
      if (result.ok) { state = result.state; listeners.forEach(listener => listener(structuredClone(state))); }
      return result;
    },
    reset() { state = createGame(state.profile); listeners.forEach(listener => listener(structuredClone(state))); },
  };
}
