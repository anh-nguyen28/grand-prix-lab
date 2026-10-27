import { DEFAULT_BUILD, PARTS, SLOTS } from './content.js';

// Field notes: Rae, the race engineer, tells the round as the story of teaching an AI.
// The round's lesson (classification) is only named in the epilogue, after the race.
export const NARRATOR = { name: 'Rae', role: 'Race engineer' };

// [in the game, in AI, the chapter where it matters most]
export const METAPHOR = [
  ['Your car', 'An AI model', 'meet'],
  ['Sensor clues', 'Data', 'data'],
  ['Labelling the surface', 'A prediction', 'label'],
  ['Choosing parts', 'Designing the model', 'train'],
  ['Practice runs', 'Training', 'train'],
  ['Qualifying', 'Validation', 'exam'],
  ['The race', 'The real world', 'race'],
];

const CHAPTERS = [
  { id: 'meet', title: 'Meet your student' },
  { id: 'data', title: 'What can it see?' },
  { id: 'label', title: 'Name the unknown' },
  { id: 'train', title: 'First lessons' },
  { id: 'exam', title: 'The exam' },
  { id: 'race', title: 'The real world' },
];

function currentChapter(state) {
  if (state.phase === 'results') return CHAPTERS.length;
  if (state.phase === 'race') return 5;
  if (['qualifying', 'adjust'].includes(state.phase)) return 4;
  if (state.runs.length || state.predictionLocked) return 3;
  return state.clues.length === 3 ? 2 : 1;
}
const untouched = state => state.phase === 'practice' && !state.clues.length && !state.runs.length && SLOTS.every(slot => state.build[slot] === DEFAULT_BUILD[slot]);

const capital = word => word.charAt(0).toUpperCase() + word.slice(1);

function lines(id, state) {
  const sensor = PARTS[state.build.sensor].name.toLowerCase();
  switch (id) {
    case 'meet': return [
      'Here is the thing nobody tells you about this car: it cannot see the track.',
      'It will drive itself through Dune Valley, a place it has never been. Everything it knows, it learns from you. In other words, you are about to teach an AI.',
    ];
    case 'data': return state.clues.length === 0 ? [
      `One stretch of the course is a mystery. Your ${sensor} can take three readings of it.`,
      'Those readings are data: the only evidence a model ever gets about the world. A better sensor costs credits your car could use. Data is never free.',
    ] : state.clues.length < 3 ? [
      `${state.clues.length} of 3 readings in. Do not decide yet. One clue can mislead you; patterns are harder to fool.`,
    ] : [
      'All three readings are in. Which one actually changed your mind? Hold on to that thought.',
    ];
    case 'label':
      if (state.predictionLocked) return state.prediction
        ? [`You labelled the mystery stretch “${capital(state.prediction)}”. We find out after the race whether the label was right.`]
        : ['You sent the car out without a label. It will have to learn the hard way. You can still earn every race point.'];
      return [
        'Your car cannot race on “unknown”. Look at the readings and give the stretch a label: road, sand or rock.',
        'A correct label earns 3 bonus points. It does not change the car; your tyres decide the grip.',
      ];
    case 'train': {
      const last = state.runs.at(-1), first = state.runs[0];
      if (!last) return [
        'Now build a car that suits what you found, then send it out. Every practice run comes back with its mistakes marked.',
        'Try, measure the error, adjust. That loop is how a model learns.',
      ];
      const miss = last.segments.find(segment => !segment.good);
      const progress = state.runs.length > 1 ? `Run 2 was ${(first.time - last.time >= 0 ? `${(first.time - last.time).toFixed(2)}s quicker` : `${(last.time - first.time).toFixed(2)}s slower`)} than run 1. ` : '';
      return [
        `${progress}Run ${state.runs.length}: ${last.time.toFixed(2)}s. ${miss ? `${miss.name}: ${miss.problem.toLowerCase()}` : 'No sector lost real time. That is a well-taught car.'}`,
        state.runs.length < 2 ? 'Change one thing and run it again, so you know what made the difference.' : 'Both practice runs are used. You can still change parts before qualifying.',
      ];
    }
    case 'exam': return state.phase === 'adjust' ? [
      `Qualifying: ${state.qualifying.time.toFixed(2)}s. That lap was the honest test: no retries, scored on its own.`,
      'You can change up to two parts now. Fix what the exam showed you; do not rebuild from scratch.',
    ] : [
      'Qualifying is one timed lap that sets your grid spot. It checks whether your car really learned, or just got lucky in practice.',
    ];
    case 'race': return [
      'Eight laps against nineteen rivals. No more tuning: this is your model meeting the real world.',
    ];
  }
  return [];
}

export function storyChapters(state) {
  const current = currentChapter(state);
  return CHAPTERS.map((chapter, index) => ({
    ...chapter, number: index + 1,
    status: index < current ? 'done' : index === current ? 'current' : 'locked',
    // The introduction stays open until the player starts working.
    autoOpen: chapter.id === 'meet' && untouched(state),
    lines: index <= current ? lines(chapter.id, state) : [],
  }));
}
