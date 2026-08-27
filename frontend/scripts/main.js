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

const router = Router();

router.addRoute({
  path: "/lobby",
  handler: () => {
    patchDOM(router);
    wireLobby();
  },
  component: () => App(Lobby()),
});

router.addRoute({
  path: "/waiting",
  handler: () => { patchDOM(router); wireWaiting(); },
  component: () => App(Waiting()),
});

router.addRoute({
  path: "/",
  handler: () => {
    patchDOM(router);
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
  if (!playerId) { window.location.href = "/lobby"; return; }

  connectWebSocket(playerId, {
    onRoomUpdate: (room) => {
      updateWaitingUI(room.playerCount);
      if (room.playerCount >= 4) { // need to be updated !!!
        closeWebSocket();
        if (room.state === "waiting") api.startRoom(room.id).catch(() => {});
        window.location.href = "/";
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