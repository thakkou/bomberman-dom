"use strict";

import { getConfig } from "./api.js";
import { sendGameAction } from "./ws.js";

const config = await getConfig();
const myPlayerId = sessionStorage.getItem("bomberman:playerId");

function generateMapCubes() {
  const container = document.getElementById("map-game");
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < config.BOARD_SIZE; index++) {
    const cube = document.createElement("div");
    cube.id = `cube-${index}`;
    cube.className = "cube";
    if (config.WALLS.includes(index)) cube.classList.add("cant-be-broken");
    fragment.appendChild(cube);
  }
  container.appendChild(fragment);
}

// function generateObstacles(amount = 100) {
//   game.boxes.clear();
//   const available = [];
//   for (let index = 0; index < config.BOARD_SIZE; index++) {
//     if (!cantBeBroken.has(index) && !emptySpaces.has(index)) available.push(index);
//   }
//   for (let index = available.length - 1; index > 0; index--) {
//     const randomIndex = Math.floor(Math.random() * (index + 1));
//     [available[index], available[randomIndex]] = [available[randomIndex], available[index]];
//   }
//   available.slice(0, Math.min(amount, available.length)).forEach((position) => game.boxes.add(position));
// }

// function playersInitState() {
//   game.playerPosition = config.START_POSITION;
//   renderGame();
// }

// function renderGame() { // depends on (config.BOARD_SIZE, game)
//   for (let index = 0; index < config.BOARD_SIZE; index++) {
//     const cube = document.getElementById(`cube-${index}`);
//     cube.classList.toggle("box", game.boxes.has(index));
//     cube.classList.toggle("bomb", game.bombs.has(index));
//     cube.classList.toggle("explosion", game.explosions.has(index));
//     cube.classList.toggle("player", index === game.playerPosition && !game.isGameOver);
//     cube.textContent = game.explosions.has(index) ? "💥"
//       : game.bombs.has(index) ? "💣"
//       : index === game.playerPosition && !game.isGameOver ? "Player"
//       : game.boxes.has(index) ? "Box" : "";
//   }
//   document.getElementById("lives").textContent = game.lives;
//   document.getElementById("score").textContent = game.score;
// }

export function renderGame(game) {
  // console.log(game)
  for (let index = 0; index < config.BOARD_SIZE; index++) {
    const cube = document.getElementById(`cube-${index}`);
    cube.className = "cube"; // reset, since players move between renders
    cube.classList.toggle("box", game.boxes.includes(index));
    cube.classList.toggle("cant-be-broken", config.WALLS.includes(index));
    cube.classList.toggle("bomb", game.bombs.includes(index));
    cube.classList.toggle("explosion", game.explosions.includes(index));
    cube.textContent = game.explosions.includes(index) ? "💥"
      : game.bombs.includes(index) ? "💣"
      : game.boxes.includes(index) ? "Box" : "";
  }

  Object.entries(game.players).forEach(([playerId, player], i) => {
    if (!player.alive) return;
    const cell = document.getElementById(`cube-${player.position}`);
    cell.classList.add("player", `player-${i}`);
    if (playerId === myPlayerId) cell.classList.add("player-me");
    cell.textContent = "🙂";
  });

  const me = game.players[myPlayerId];
  if (me) {
    document.getElementById("lives").textContent = me.lives;
    document.getElementById("score").textContent = me.score;
  }

  const messageEl = document.getElementById("game-message");
  if (game.winnerId) {
    messageEl.textContent = game.winnerId === myPlayerId ? "You win!" : "Game over — another player won.";
  } else if (me && !me.alive) {
    messageEl.textContent = "You're out! Spectating the rest of the match.";
  }
}

// -----------------------------------------------------------
// animation & controls
// -----------------------------------------------------------

// function isValidMove(from, to) {
//   if (to < 0 || to >= config.BOARD_SIZE) return false;
//   if (Math.abs(to - from) === 1 && Math.floor(to / config.BOARD_COLUMNS) !== Math.floor(from / config.BOARD_COLUMNS)) return false;
//   return !cantBeBroken.has(to) && !game.boxes.has(to) && !game.bombs.has(to);
// }

// function movePlayer(offset) {
//   if (game.isGameOver) return;
//   const nextPosition = game.playerPosition + offset;
//   if (!isValidMove(game.playerPosition, nextPosition)) return;
//   game.playerPosition = nextPosition;
//   renderGame();
//   if (game.explosions.has(nextPosition)) loseLife();
// }

// function movePlayerLeft() { movePlayer(-1); }
// function movePlayerRight() { movePlayer(1); }
// function movePlayerUp() { movePlayer(-config.BOARD_COLUMNS); }
// function movePlayerDown() { movePlayer(config.BOARD_COLUMNS); }

// function generateBomb() {
//   if (game.isGameOver || game.bombs.size > 0) return false;
//   const position = game.playerPosition;
//   const timer = window.setTimeout(() => explodeBomb(position), config.BOMB_DELAY);
//   game.bombs.set(position, timer);
//   renderGame();
//   return true;
// }

// function blastPositions(origin) {
//   const positions = [origin];
//   for (const direction of [-1, 1, -config.BOARD_COLUMNS, config.BOARD_COLUMNS]) {
//     for (let distance = 1; distance <= config.BLAST_RANGE; distance++) {
//       const position = origin + direction * distance;
//       if (position < 0 || position >= config.BOARD_SIZE) break;
//       if (Math.abs(direction) === 1 && Math.floor(position / config.BOARD_COLUMNS) !== Math.floor(origin / config.BOARD_COLUMNS)) break;
//       if (cantBeBroken.has(position)) break;
//       positions.push(position);
//       if (game.boxes.has(position)) break;
//     }
//   }
//   return positions;
// }

// function explodeBomb(position) {
//   if (!game.bombs.has(position)) return;
//   window.clearTimeout(game.bombs.get(position));
//   game.bombs.delete(position);
//   const blast = blastPositions(position);
//   for (const blastPosition of blast) {
//     game.explosions.add(blastPosition);
//     destroyObstacle(blastPosition);
//   }
//   renderGame();
//   calculeBombPower(blast);
//   blast.forEach((blastPosition) => {
//     if (game.bombs.has(blastPosition)) explodeBomb(blastPosition);
//   });
//   window.setTimeout(() => {
//     blast.forEach((blastPosition) => game.explosions.delete(blastPosition));
//     renderGame();
//   }, config.EXPLOSION_TIME);
// }

// function destroyObstacle(position) {
//   if (!game.boxes.delete(position)) return false;
//   game.score += config.BOX_SCORE;
//   updateScore();
//   return true;
// }

// function calculeBombPower(blast) {
//   if (blast.includes(game.playerPosition)) loseLife();
//   return blast;
// }

// function updateScore() {
//   document.getElementById("score").textContent = game.score;
// }

// function updateLives(change = -1) {
//   game.lives = Math.max(0, game.lives + change);
//   document.getElementById("lives").textContent = game.lives;
//   return game.lives;
// }

// function loseLife() {
//   if (game.isInvulnerable || game.isGameOver) return;
//   game.isInvulnerable = true;
//   updateLives(-1);
//   if (game.lives === 0) {
//     game.isGameOver = true;
//     document.getElementById("game-message").textContent = `Game over. Final score: ${game.score}. Press R to restart.`;
//     renderGame();
//     return;
//   }
//   document.getElementById("game-message").textContent = "You were hit! Respawning...";
//   window.setTimeout(() => {
//     game.playerPosition = config.START_POSITION;
//     game.isInvulnerable = false;
//     document.getElementById("game-message").textContent = "Move with Arrow keys or WASD. Drop a bomb with Space.";
//     renderGame();
//   }, 900);
// }

// -----------------------------------------------------------------

// function restartGame() { // i think not needed for now !
//   game.bombs.forEach((timer) => window.clearTimeout(timer));
//   Object.assign(game, {
//     playerPosition: config.START_POSITION,
//     lives: config.STARTING_LIVES,
//     score: 0,
//     isInvulnerable: false,
//     isGameOver: false,
//   });
//   game.bombs.clear();
//   game.explosions.clear();
//   generateObstacles();
//   document.getElementById("game-message").textContent = "Move with Arrow keys or WASD. Drop a bomb with Space.";
//   renderGame();
// }


// export function startGame() {
//   generateMapCubes();
//   generateObstacles();
//   playersInitState();
  
//   Object.assign(window, {
//     movePlayerLeft, movePlayerRight, movePlayerUp, movePlayerDown,
//     generateBomb, destroyObstacle, calculeBombPower, updateLives, restartGame,
//     __bombermanGame: game,
//   });

//   document.addEventListener("keydown", (event) => {
//     if (event.target.matches("input, textarea")) return; // reserved for chat
//     const actions = {
//       ArrowLeft: movePlayerLeft, a: movePlayerLeft,
//       ArrowRight: movePlayerRight, d: movePlayerRight,
//       ArrowUp: movePlayerUp, w: movePlayerUp,
//       ArrowDown: movePlayerDown, s: movePlayerDown,
//       " ": generateBomb,
//     };
//     const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
//     if (actions[key]) {
//       event.preventDefault();
//       actions[key]();
//     } else if (key === "r" && game.isGameOver) {
//       restartGame();
//     }
//   });
// }

export function startGame() {
  generateMapCubes();

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea")) return;
    const directions = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right",
                          ArrowUp: "up", w: "up", ArrowDown: "down", s: "down" };
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (directions[key]) { event.preventDefault(); sendGameAction({ type: "move", direction: directions[key] }); }
    else if (key === " ") { event.preventDefault(); sendGameAction({ type: "bomb" }); }
  });
}

