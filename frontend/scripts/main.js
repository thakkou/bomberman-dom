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
import { startGame } from "./game.js";

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
    patchDOM(router);
    startGame();
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
  const form = document.getElementById("nickname-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = document.getElementById("nickname");
    const errorEl = document.getElementById("lobby-error");
    const nickname = input.value.trim();
    errorEl.textContent = "";

    try {
      const data = await api.joinQueue(nickname);
      sessionStorage.setItem("bomberman:playerId", data.player.id);
      sessionStorage.setItem("bomberman:nickname", nickname);
      window.location.href = "/#/waiting"; // use navigate or href
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

// --- Waiting room polling -----------------------------------------

function wireWaiting() {
  const playerId = sessionStorage.getItem("bomberman:playerId");
  if (!playerId) { window.location.href = "/#/lobby"; return; }

  connectWebSocket(playerId, {
    onRoomUpdate: (room) => {
      // console.log('x')
      // setTimeout(1500)
      updateWaitingUI(room.playerCount);
      if (room.playerCount >= 4) { // need to be updated !!!
        // closeWebSocket();
        if (room.state === "waiting") api.startRoom(room.id).catch(() => {});
        setTimeout(() => redirectTo('/'), 1000); 
        // window.location.href = "/";
      }
    },
    onQueueUpdate: (queuePosition) => {
      // optional: show "Position N in queue"
      updateWaitingUI(queuePosition);
    },
    onError: (err) => console.error("WebSocket error", err),
  });
}

function updateWaitingUI(count) {
  const countEl = document.getElementById("player-count");
  if (countEl) countEl.textContent = count;
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
  const { playerId, status, room } = await fetchPlayerState();
  if (!playerId) return false; // no session -> lobby is correct, let it render

  if (status === "room" && room.state === "playing") return redirectTo("/");
  return redirectTo("/waiting"); // still queued, or in a room that hasn't started
}

async function guardWaiting() {
  const { playerId, status, room } = await fetchPlayerState();
  if (!playerId) return redirectTo("/lobby");

  if (status === "room" && room.state === "playing") return redirectTo("/");
  return false; // queued or room-not-playing -> waiting page is correct
}

async function guardGame() {
  const { playerId, status, room } = await fetchPlayerState();
  if (!playerId) return redirectTo("/lobby");

  const isPlaying = status === "room" && room.state === "playing";
  if (!isPlaying) return redirectTo("/waiting");
  return false;
}