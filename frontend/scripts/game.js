"use strict";

import { getConfig } from "./api.js";

const config = await getConfig();

const cantBeBroken = new Set([
  20, 22, 24, 26, 28, 30, 32, 34, 36, 58, 60, 62, 64, 66, 68, 70, 72, 74,
  96, 98, 100, 102, 104, 106, 108, 110, 112, 134, 136, 138, 140, 142, 144,
  146, 148, 150, 172, 174, 176, 178, 180, 182, 184, 186, 188,
]);
// Keep two escape steps clear from the single-player spawn so a first bomb is survivable.
const emptySpaces = new Set([0, 1, 2, 17, 18, 19, 37, 38, 171, 189, 190, 191, 207, 208]);

const game = {
  playerPosition: config.START_POSITION,
  lives: config.STARTING_LIVES,
  score: 0,
  boxes: new Set(),
  bombs: new Map(),
  explosions: new Set(),
  isInvulnerable: false,
  isGameOver: false,
};

function generateMapCubes() { // depends on (config.BOARD_SIZE)
  const container = document.getElementById("map-game");
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < config.BOARD_SIZE; index++) {
    const cube = document.createElement("div");
    cube.id = `cube-${index}`;
    cube.className = "cube";
    if (cantBeBroken.has(index)) cube.classList.add("cant-be-broken");
    if (emptySpaces.has(index)) cube.classList.add("empty-space");
    fragment.appendChild(cube);
  }
  container.appendChild(fragment);
}

function generateObstacles(amount = 100) {
  game.boxes.clear();
  const available = [];
  for (let index = 0; index < config.BOARD_SIZE; index++) {
    if (!cantBeBroken.has(index) && !emptySpaces.has(index)) available.push(index);
  }
  for (let index = available.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [available[index], available[randomIndex]] = [available[randomIndex], available[index]];
  }
  available.slice(0, Math.min(amount, available.length)).forEach((position) => game.boxes.add(position));
}

function playersInitState() {
  game.playerPosition = config.START_POSITION;
  renderGame();
}

function renderGame() { // depends on (config.BOARD_SIZE, game)
  for (let index = 0; index < config.BOARD_SIZE; index++) {
    const cube = document.getElementById(`cube-${index}`);
    cube.classList.toggle("box", game.boxes.has(index));
    cube.classList.toggle("bomb", game.bombs.has(index));
    cube.classList.toggle("explosion", game.explosions.has(index));
    cube.classList.toggle("player", index === game.playerPosition && !game.isGameOver);
    cube.textContent = game.explosions.has(index) ? "💥"
      : game.bombs.has(index) ? "💣"
      : index === game.playerPosition && !game.isGameOver ? "Player"
      : game.boxes.has(index) ? "Box" : "";
  }
  document.getElementById("lives").textContent = game.lives;
  document.getElementById("score").textContent = game.score;
}

// -----------------------------------------------------------
// animation & controls
// -----------------------------------------------------------

function isValidMove(from, to) {
  if (to < 0 || to >= config.BOARD_SIZE) return false;
  if (Math.abs(to - from) === 1 && Math.floor(to / config.BOARD_COLUMNS) !== Math.floor(from / config.BOARD_COLUMNS)) return false;
  return !cantBeBroken.has(to) && !game.boxes.has(to) && !game.bombs.has(to);
}

function movePlayer(offset) {
  if (game.isGameOver) return;
  const nextPosition = game.playerPosition + offset;
  if (!isValidMove(game.playerPosition, nextPosition)) return;
  game.playerPosition = nextPosition;
  renderGame();
  if (game.explosions.has(nextPosition)) loseLife();
}

function movePlayerLeft() { movePlayer(-1); }
function movePlayerRight() { movePlayer(1); }
function movePlayerUp() { movePlayer(-config.BOARD_COLUMNS); }
function movePlayerDown() { movePlayer(config.BOARD_COLUMNS); }

function generateBomb() {
  if (game.isGameOver || game.bombs.size > 0) return false;
  const position = game.playerPosition;
  const timer = window.setTimeout(() => explodeBomb(position), config.BOMB_DELAY);
  game.bombs.set(position, timer);
  renderGame();
  return true;
}

function blastPositions(origin) {
  const positions = [origin];
  for (const direction of [-1, 1, -config.BOARD_COLUMNS, config.BOARD_COLUMNS]) {
    for (let distance = 1; distance <= config.BLAST_RANGE; distance++) {
      const position = origin + direction * distance;
      if (position < 0 || position >= config.BOARD_SIZE) break;
      if (Math.abs(direction) === 1 && Math.floor(position / config.BOARD_COLUMNS) !== Math.floor(origin / config.BOARD_COLUMNS)) break;
      if (cantBeBroken.has(position)) break;
      positions.push(position);
      if (game.boxes.has(position)) break;
    }
  }
  return positions;
}

function explodeBomb(position) {
  if (!game.bombs.has(position)) return;
  window.clearTimeout(game.bombs.get(position));
  game.bombs.delete(position);
  const blast = blastPositions(position);
  for (const blastPosition of blast) {
    game.explosions.add(blastPosition);
    destroyObstacle(blastPosition);
  }
  renderGame();
  calculeBombPower(blast);
  blast.forEach((blastPosition) => {
    if (game.bombs.has(blastPosition)) explodeBomb(blastPosition);
  });
  window.setTimeout(() => {
    blast.forEach((blastPosition) => game.explosions.delete(blastPosition));
    renderGame();
  }, config.EXPLOSION_TIME);
}

function destroyObstacle(position) {
  if (!game.boxes.delete(position)) return false;
  game.score += config.BOX_SCORE;
  updateScore();
  return true;
}

function calculeBombPower(blast) {
  if (blast.includes(game.playerPosition)) loseLife();
  return blast;
}

function updateScore() {
  document.getElementById("score").textContent = game.score;
}

function updateLives(change = -1) {
  game.lives = Math.max(0, game.lives + change);
  document.getElementById("lives").textContent = game.lives;
  return game.lives;
}

function loseLife() {
  if (game.isInvulnerable || game.isGameOver) return;
  game.isInvulnerable = true;
  updateLives(-1);
  if (game.lives === 0) {
    game.isGameOver = true;
    document.getElementById("game-message").textContent = `Game over. Final score: ${game.score}. Press R to restart.`;
    renderGame();
    return;
  }
  document.getElementById("game-message").textContent = "You were hit! Respawning...";
  window.setTimeout(() => {
    game.playerPosition = config.START_POSITION;
    game.isInvulnerable = false;
    document.getElementById("game-message").textContent = "Move with Arrow keys or WASD. Drop a bomb with Space.";
    renderGame();
  }, 900);
}

// -----------------------------------------------------------------

function restartGame() { // i think not needed for now !
  game.bombs.forEach((timer) => window.clearTimeout(timer));
  Object.assign(game, {
    playerPosition: config.START_POSITION,
    lives: config.STARTING_LIVES,
    score: 0,
    isInvulnerable: false,
    isGameOver: false,
  });
  game.bombs.clear();
  game.explosions.clear();
  generateObstacles();
  document.getElementById("game-message").textContent = "Move with Arrow keys or WASD. Drop a bomb with Space.";
  renderGame();
}


export function startGame() {
  generateMapCubes();
  generateObstacles();
  playersInitState();
  
  Object.assign(window, {
    movePlayerLeft, movePlayerRight, movePlayerUp, movePlayerDown,
    generateBomb, destroyObstacle, calculeBombPower, updateLives, restartGame,
    __bombermanGame: game,
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea")) return; // reserved for chat
    const actions = {
      ArrowLeft: movePlayerLeft, a: movePlayerLeft,
      ArrowRight: movePlayerRight, d: movePlayerRight,
      ArrowUp: movePlayerUp, w: movePlayerUp,
      ArrowDown: movePlayerDown, s: movePlayerDown,
      " ": generateBomb,
    };
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (actions[key]) {
      event.preventDefault();
      actions[key]();
    } else if (key === "r" && game.isGameOver) {
      restartGame();
    }
  });
}

