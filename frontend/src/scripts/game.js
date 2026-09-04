"use strict";

import { getConfig } from "../services/api.js";
import { sendGameAction } from "../services/ws.js";

const config = await getConfig();
const myPlayerId = sessionStorage.getItem("bomberman:playerId");

const MOVE_DURATION = 150;
const POWERUP_ICONS = { bombs: "💣+", flames: "🔥+", speed: "⚡" };

let latestGame = null;
let renderedGame = null;
let isDirty = false;
let rafId = null;

let roomState = null;
let startCountdownInterval = null;

const playerEls = new Map();  // playerId -> DOM element
const playerAnim = new Map(); // playerId -> { fromX, fromY, toX, toY, startTime }

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

function cellSize() {
  return document.getElementById("cube-0").getBoundingClientRect().width;
}

function indexToXY(index, size) {
  const col = index % config.BOARD_COLUMNS;
  const row = Math.floor(index / config.BOARD_COLUMNS);
  return { x: col * size, y: row * size };
}

function currentAnimatedPosition(anim) {
  const t = Math.min(1, (performance.now() - anim.startTime) / MOVE_DURATION);
  return {
    x: anim.fromX + (anim.toX - anim.fromX) * t,
    y: anim.fromY + (anim.toY - anim.fromY) * t,
  };
}

function ensurePlayerElement(playerId, index, size) {
  let el = playerEls.get(playerId);
  if (el) return el;

  el = document.createElement("div");
  el.className = "player-token";
  el.textContent = "🙂";
  document.getElementById("map-game").appendChild(el);
  playerEls.set(playerId, el);

  const { x, y } = indexToXY(index, size);
  el.style.transform = `translate(${x}px, ${y}px)`;
  playerAnim.set(playerId, { fromX: x, fromY: y, toX: x, toY: y, startTime: 0 });
  return el;
}

function queueMove(playerId, index, size) {
  const { x, y } = indexToXY(index, size);
  const from = currentAnimatedPosition(playerAnim.get(playerId));
  playerAnim.set(playerId, { fromX: from.x, fromY: from.y, toX: x, toY: y, startTime: performance.now() });
}

// --- state -> DOM, only when new data arrived (called from the rAF loop) ---

function renderStaticCells(game) {
  const powerupAt = new Map(game.powerups.map(p => [p.position, p.type]));

  for (let index = 0; index < config.BOARD_SIZE; index++) {
    const cube = document.getElementById(`cube-${index}`);
    const isBox = game.boxes.includes(index);
    const isBomb = game.bombs.includes(index);
    const isExplosion = game.explosions.includes(index);
    const powerupType = powerupAt.get(index);

    cube.classList.toggle("box", isBox);
    cube.classList.toggle("bomb", isBomb);
    cube.classList.toggle("explosion", isExplosion);
    cube.classList.toggle("powerup", Boolean(powerupType) && !isExplosion);
    cube.dataset.powerup = powerupType ?? "";

    cube.textContent = isExplosion ? "💥"
      : isBomb ? "💣"
        : isBox ? "Box"
          : powerupType ? POWERUP_ICONS[powerupType]
            : "";
  }
}

function renderPlayers(game, size) {
  Object.entries(game.players).forEach(([playerId, player], i) => {
    const el = ensurePlayerElement(playerId, player.position, size);
    el.classList.toggle(`player-${i}`, true);
    el.classList.toggle("player-me", playerId === myPlayerId);
    el.style.display = player.alive ? "" : "none";

    const prevPosition = renderedGame?.players?.[playerId]?.position;
    if (prevPosition !== player.position) queueMove(playerId, player.position, size);
  });
}

function renderHUD(game) {
  const hudContainer = document.getElementById("hud-players");
  if (!hudContainer) return;

  hudContainer.replaceChildren();

  Object.entries(game.players).forEach(([playerId, player], i) => {
    const row = document.createElement("div");
    row.className = `hud-player player-${i}`;
    if (playerId === myPlayerId) row.classList.add("hud-player-me");
    if (!player.alive) row.classList.add("hud-player-dead");

    const name = document.createElement("span");
    name.className = "hud-name";
    name.textContent = playerId === myPlayerId ? "You" : player.nickname;

    const lives = document.createElement("span");
    lives.className = "hud-lives";
    lives.textContent = "❤".repeat(Math.max(0, player.lives));

    const score = document.createElement("span");
    score.className = "hud-score";
    score.textContent = `${player.score} pts`;

    row.append(name, lives, score);

    if (playerId === myPlayerId) {
      const powerups = document.createElement("span");
      powerups.className = "hud-powerups";
      powerups.textContent = `💣×${player.maxBombs}  🔥${player.blastRange}  ⚡${player.speedLevel}`;
      row.appendChild(powerups);
    }

    hudContainer.appendChild(row);
  });

  const messageEl = document.getElementById("game-message");
  const me = game.players[myPlayerId];
  if (game.winnerId) {
    messageEl.textContent = game.winnerId === myPlayerId ? "You win!" : "Game over — another player won.";
  } else if (me && !me.alive) {
    messageEl.textContent = "You're out! Spectating the rest of the match.";
  }
}

// --- the animation loop ---

function tick() {
  if (isDirty && latestGame) {
    try {
      const size = cellSize() + 1;
      renderStaticCells(latestGame);
      renderPlayers(latestGame, size);
      renderHUD(latestGame);
      renderedGame = latestGame;
    } catch (err) {
      console.error("Render error (skipping this frame):", err);
    } finally {
      isDirty = false;
    }
  }

  for (const [playerId, anim] of playerAnim) {
    const el = playerEls.get(playerId);
    if (!el) continue;
    const { x, y } = currentAnimatedPosition(anim);
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  rafId = requestAnimationFrame(tick);
}

// --- public API ---

function toggleBoardVisibility() {
  const board = document.getElementById("map-game");
  const overlay = document.getElementById("start-countdown");
  if (!board || !overlay) return;

  const starting = roomState === "starting";
  board.style.display = starting ? "none" : "";
  overlay.style.display = starting ? "" : "none";
  if (!starting && startCountdownInterval) { clearInterval(startCountdownInterval); startCountdownInterval = null; }
}

function startCountdownDisplay(endsAt) {
  const overlay = document.getElementById("start-countdown");
  if (!overlay) return;
  if (startCountdownInterval) clearInterval(startCountdownInterval);

  const tick = () => {
    const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    overlay.textContent = `Game starts in ${secondsLeft}s`;
    if (secondsLeft <= 0) clearInterval(startCountdownInterval);
  };
  tick();
  startCountdownInterval = setInterval(tick, 250);
}

export function onGameUpdate(game, newRoomState, countdownEndsAt) {
  if (newRoomState && newRoomState !== roomState) {
    roomState = newRoomState;
    toggleBoardVisibility();
  }
  if (roomState === "starting" && countdownEndsAt) startCountdownDisplay(countdownEndsAt);

  latestGame = game;
  isDirty = true;
}

export function startGame() {
  roomState = null;
  generateMapCubes();
  if (!rafId) rafId = requestAnimationFrame(tick);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea")) return;
    const directions = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right",
                          ArrowUp: "up", w: "up", ArrowDown: "down", s: "down" };
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (directions[key]) { event.preventDefault(); sendGameAction({ type: "move", direction: directions[key] }); }
    else if (key === " ") { event.preventDefault(); sendGameAction({ type: "bomb" }); }
  });
}

export function stopGame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}