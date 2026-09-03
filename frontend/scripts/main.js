import Router from "mini-framework/src/router.js";
import { patchDOM } from "mini-framework/src/vdom/index.js";

import App from "../components/App.js";
import Lobby from "../components/Lobby.js";
import Waiting from "../components/Waiting.js";
import Game from "../components/Game.js";
import Chat from "../components/Chat.js";
import NotFound from "../components/NotFound.js";

import * as api from "./api.js";
import { connectWebSocket, closeWebSocket } from "./ws.js";
import { startGame, onGameUpdate, stopGame } from "./game.js";

const router = Router();

router.addRoute({
  path: "/lobby",
  handler: async () => {
    if (await guardLobby()) return;
    patchDOM(router);
    wireLobby();
  },
  component: () => App(Lobby()),
});

router.addRoute({
  path: "/waiting",
  handler: async () => {
    if (await guardWaiting()) return;
    patchDOM(router);
    wireWaiting();
  },
  component: () => App(Waiting()),
});

router.addRoute({
  path: "/",
  handler: async () => {
    if (await guardGame()) return;
    stopWaitingTimers();
    patchDOM(router);
    startGame();
    connectWebSocket(sessionStorage.getItem("bomberman:playerId"), {
      // ...existing handlers from wireWaiting stay for the waiting page only...
      onGameUpdate: (game, roomState, countdownEndsAt) => onGameUpdate(game, roomState, countdownEndsAt),
      onOpponentsLeft: () => {
        closeWebSocket();
        sessionStorage.removeItem("bomberman:playerId"); // keep nickname for prefill
        sessionStorage.setItem("bomberman:opponentsLeft", "1");
        window.location.href = "/#/lobby";
      },
    });
  },
  component: () => App(Game(), Chat()),
});

router.addRoute({
  path: "*",
  handler: () => {
    patchDOM(router);
  },
  component: () => App(NotFound()),
});

router.init();

// --- Lobby -> backend -------------------------------------------

function wireLobby() {
  stopGame();
  stopWaitingTimers();

  const form = document.getElementById("nickname-form");
  if (!form) return;

  const input = document.getElementById("nickname");
  const errorEl = document.getElementById("lobby-error");

  if (sessionStorage.getItem("bomberman:opponentsLeft")) {
    sessionStorage.removeItem("bomberman:opponentsLeft");
    input.value = sessionStorage.getItem("bomberman:nickname") ?? "";
    errorEl.style.display = 'flex';
    errorEl.textContent = "All other players left the game.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.getElementById("nickname");
    const errorEl = document.getElementById("lobby-error");
    const nickname = input.value.trim();
    errorEl.textContent = "";
    errorEl.style.display = 'none';

    try {
      const data = await api.joinQueue(nickname);
      sessionStorage.setItem("bomberman:playerId", data.player.id);
      sessionStorage.setItem("bomberman:nickname", nickname);
      window.location.href = "/#/waiting"; // use navigate or href
    } catch (err) {
      errorEl.style.display = 'flex';
      errorEl.textContent = err.message;
    }
  });
}

// --- Waiting room polling -----------------------------------------

let tickHandle = null;

function wireWaiting() {
  const playerId = sessionStorage.getItem("bomberman:playerId");
  if (!playerId) { window.location.href = "/#/lobby"; return; }

  connectWebSocket(playerId, {
    onRoomUpdate: (room) => updateWaitingUI(room.playerCount),
    onQueueUpdate: (queuePosition) => updateWaitingUI(queuePosition),
    onQueueTimer: (endsAt) => startTimerDisplay("queue-timer", endsAt, "Locking in players in"),
    // onCountdown: (endsAt) => {
      //   document.getElementById("queue-timer").textContent = "";
      //   startTimerDisplay("countdown-timer", endsAt, "Game starts in");
      // },
    onGameUpdate: () => { stopWaitingTimers(); setTimeout(() => redirectTo("/"), 200); }, // fires on "starting" now — redirect immediately
    // onGameUpdate: () => {
    //   setTimeout(() => redirectTo("/"), 300);
    // }, // countdown hit 0, room started
    onTimerCancelled: (timer) => {
      if (tickHandle) clearInterval(tickHandle);
      const elementId = timer === "countdown" ? "countdown-timer" : "queue-timer";
      const el = document.getElementById(elementId);
      if (el) el.textContent = "";
    },
    onError: (err) => console.error("WebSocket error", err),
  });

  document.getElementById("leave-waiting")?.addEventListener("click", async () => {
    stopWaitingTimers();
    const playerId = sessionStorage.getItem("bomberman:playerId");
    if (playerId) await api.leaveQueue(playerId).catch(() => {});
    sessionStorage.removeItem("bomberman:playerId");
    sessionStorage.removeItem("bomberman:nickname");
    window.location.href = "/#/lobby";
  });
}

function startTimerDisplay(elementId, endsAt, label) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (tickHandle) clearInterval(tickHandle);

  const tick = () => {
    const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    el.textContent = `${label} ${secondsLeft}s`;
    if (secondsLeft <= 0) clearInterval(tickHandle);
  };
  tick();
  tickHandle = setInterval(tick, 250);
}

function updateWaitingUI(count) {
  const countEl = document.getElementById("player-count");
  if (countEl) countEl.textContent = count;
}

function stopWaitingTimers() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
  document.getElementById("queue-timer")?.remove();
  document.getElementById("countdown-timer")?.remove();
  document.getElementById("leave-waiting")?.remove();
}

// --- Route guards ---------------------------------------------------

function redirectTo(path) {
  // console.log(window.location.pathname)
  if (window.location.hash !== path) {
    window.location.href = "/#" + path;
    return true;
  }
  return false;
}

async function fetchPlayerState() {
  const playerId = sessionStorage.getItem("bomberman:playerId");
  if (!playerId) return { playerId: null };

  try {
    const data = await api.getPlayerStatus(playerId);
    return { playerId, ...data }; // { playerId, status, room?, queuePosition? }
  } catch {
    // Player no longer exists server-side (expired, left, server restarted).
    sessionStorage.removeItem("bomberman:playerId");
    sessionStorage.removeItem("bomberman:nickname");
    return { playerId: null };
  }
}

async function guardLobby() {
  const { playerId, status } = await fetchPlayerState();
  if (!playerId) return false;
  return redirectTo(status === "room" ? "/" : "/waiting");
}
// async function guardLobby() {
//   const { playerId, status, room } = await fetchPlayerState();
//   if (!playerId) return false; // no session -> lobby is correct, let it render

//   if (status === "room" && room.state === "playing") return redirectTo("/");
//   return redirectTo("/waiting"); // still queued, or in a room that hasn't started
// }

async function guardWaiting() {
  const { playerId, status } = await fetchPlayerState();
  if (!playerId) return redirectTo("/lobby");
  if (status === "room") return redirectTo("/");
  return false;
}
// async function guardWaiting() {
//   const { playerId, status, room } = await fetchPlayerState();
//   if (!playerId) return redirectTo("/lobby");

//   if (status === "room" && room.state === "playing") return redirectTo("/");
//   return false; // queued or room-not-playing -> waiting page is correct
// }

async function guardGame() {
  const { playerId, status } = await fetchPlayerState();
  if (!playerId) return redirectTo("/lobby");
  if (status !== "room") return redirectTo("/waiting");
  return false;
}
// async function guardGame() {
//   const { playerId, status, room } = await fetchPlayerState();
//   if (!playerId) return redirectTo("/lobby");

//   const isPlaying = status === "room" && room.state === "playing";
//   if (!isPlaying) return redirectTo("/waiting");
//   return false;
// }




// **********************************************************************

window.addEventListener("pagehide", () => {
  // pagehide over beforeunload: it fires reliably on tab close, back/forward navigation,
  // and mobile Safari (where beforeunload is unreliable)
  closeWebSocket();

  const playerId = sessionStorage.getItem("bomberman:playerId");
  if (!playerId) return;

  // fetch is normally cancelled mid-unload; keepalive lets this last request
  // finish in the background even after the page has started tearing down.
  fetch(`http://localhost:8080/api/players/${playerId}`, {
    method: "DELETE",
    keepalive: true,
  }).catch(() => {});

  sessionStorage.removeItem("bomberman:playerId");
  sessionStorage.removeItem("bomberman:nickname");
});