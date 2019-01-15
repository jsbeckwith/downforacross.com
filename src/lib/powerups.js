import moment from 'moment';
import _ from 'lodash';

/** Status effect helpers **/

const transformClues = (game, transformation) => {
  const {clues} = game;
  const across = _.map(clues.across, transformation);
  const down = _.map(clues.down, transformation);
  return {
    ...game,
    clues: {across, down},
  };
};

const reverseClues = (game) => {
  const reverseString = (s) => s && _.reverse(s.split('')).join('');
  return transformClues(game, reverseString);
};

const removeVowels = (game) => {
  const remove = (s) => s && _.filter(s.split(''), (char) => !_.includes('aeiouAEIOU', char)).join('');
  return transformClues(game, remove);
};

const hideSquares = (game) => {
  const {grid, cursors} = game;
  const closeToCursor = (r2, c2) => {
    return _.some(cursors, ({r, c}) => Math.max(Math.abs(r2 - r), Math.abs(c2 - c)) <= 3);
  };

  return {
    ...game,
    grid: grid.map((row, r) => row.map((tile, c) => (closeToCursor(r, c) ? tile : {...tile, value: '🌚'}))),
  };
};

/** One time action helpers **/

const revealSquare = ({selected, gameModel}) => {
  gameModel.reveal([selected]);
};

/** Duration helpers **/

const secondsSince = (t) => moment.duration(moment(Date.now()).diff(moment(t))).asSeconds();

export const timeLeft = (powerup) => {
  const {type, used} = powerup;
  let {duration} = powerups[type];
  duration = parseInt(duration);
  if (!used) {
    return Math.ceiling(duration);
  } else {
    return Math.ceiling(duration - secondsSince(used));
  }
};

export const hasExpired = (powerup) => {
  return timeLeft(powerup) < 0;
};

export const inUse = (powerup) => {
  return powerup.used && !hasExpired(powerup);
};

/** Application helpers **/

export const apply = (ownGame, opponentGame, ownPowerups, opponentPowerups) => {
  if (!ownGame || !opponentGame) {
    return {ownGame, opponentGame};
  }

  const applyOneDirection = (ownGame, opponentGame, currentPowerups) => {
    const inUsePowerups = _.filter(currentPowerups, inUse);
    return _.reduce(inUsePowerups, (g, p) => powerups[p.type].action(g), {ownGame, opponentGame});
  };

  // TODO: better names for these variables / better way to do this.
  const {ownGame: ownGame1, opponentGame: opponentGame1} = applyOneDirection(
    ownGame,
    opponentGame,
    ownPowerups
  );
  const {ownGame: opponentGame2, opponentGame: ownGame2} = applyOneDirection(
    opponentGame1,
    ownGame1,
    opponentPowerups
  );
  return {ownGame: ownGame2, opponentGame: opponentGame2};
};

export const applyOneTimeEffects = (p, args) => {
  const fn = powerups[p.type].oneTimeAction;
  fn && fn(args);
};

// There should probably be an enum here with the keys of the following.
// Only image based emojis for now, until I figure out how css works...

/** Powerup data **/

const powerups = {
  REVERSE: {
    name: 'Reverse!',
    icon: 'steven',
    duration: 15,
    action: ({ownGame, opponentGame}) => ({ownGame, opponentGame: reverseClues(opponentGame)}),
  },
  DARK_MODE: {
    name: 'Dark Mode',
    icon: 'dark_moon',
    duration: 30,
    action: ({ownGame, opponentGame}) => ({ownGame, opponentGame: hideSquares(opponentGame)}),
  },
  VOWELS: {
    name: 'De-Vowel',
    icon: 'cactus_sweat',
    duration: 15,
    action: ({ownGame, opponentGame}) => ({ownGame, opponentGame: removeVowels(opponentGame)}),
  },
  REVEAL_SQUARE: {
    name: 'Reveal Square',
    icon: 'surprised_pikachu',
    duration: 0,
    action: _.identity,
    oneTimeAction: revealSquare,
  },
};

export default powerups;