"use strict";

import Router from "mini-framework/src/router.js";
import { patchDOM } from "mini-framework/src/vdom/index.js";

// States
import lobbyState from "./state/lobbyState.js";
import waitingState from "./state/waitingState.js";
import chatState from "./state/chatState.js";
import hudState from "./state/hudState.js";

// Components
import App from "./components/App.js";
import Lobby from "./components/Lobby.js";
import Waiting from "./components/Waiting.js";
import Game from "./components/Game.js";
import Chat from "./components/Chat.js";
import NotFound from "./components/NotFound.js";

import * as api from "./services/api.js";
import { connectWebSocket, closeWebSocket } from "./services/ws.js";

import { startGame, onGameUpdate, stopGame } from "./scripts/game.js";

// CHAT
import { onChatMessage, onChatHistory, onChatError, resetChat } from "./scripts/chat.js";
import { renderHud } from "./scripts/hud.js";

export const router = Router();

// subscriptions ******************************

[lobbyState].forEach(store =>
  store.subscribe(() => patchDOM(router))
);

export function patchWaiting() {
  const target = document.getElementById('waiting-component');
  if (target) patchDOM(router, target, Waiting());
}

waitingState.subscribe(patchWaiting);

export function patchChat() {
  const target = document.getElementById('chat-component');
  if (target) patchDOM(router, target, Chat());
}

chatState.subscribe(patchChat);

hudState.subscribe(renderHud);

// ********************************************

router.addRoute({
  path: "/lobby",
  handler: async () => {
    patchDOM(router);
    wireLobby();
  },
  component: () => App(Lobby()),
  guard: async () => {
    const { playerId, status } = await fetchPlayerState();
    if (!playerId) return false;
    return router.navigate(status === "room" ? "/" : "/waiting"); // navigates 2 times
  }
});

router.addRoute({
  path: "/waiting",
  handler: async () => {
    patchDOM(router);
    wireWaiting();
  },
  component: () => App(Waiting(), Chat({ hint: "Waiting for players. Say hi while you wait!" })),
  guard: async () => {
    const { playerId, status } = await fetchPlayerState();
    if (!playerId) return router.navigate("/lobby");
    if (status === "room") return router.navigate("/");
    return false;
  }
});

router.addRoute({
  path: "/",
  handler: async () => {
    stopWaitingTimers();
    patchDOM(router);
    startGame();
    // wireChat();
    connectWebSocket(localStorage.getItem("bomberman:playerId"), {
      // ...existing handlers from wireWaiting stay for the waiting page only...
      onGameUpdate: (game, roomState, countdownEndsAt) => onGameUpdate(game, roomState, countdownEndsAt),
      onOpponentsLeft: () => {
        closeWebSocket();
        localStorage.removeItem("bomberman:playerId"); // keep nickname for prefill
        localStorage.setItem("bomberman:opponentsLeft", "1");
        router.navigate("/lobby");
      },
      onChatMessage: (message) => onChatMessage(message),
      onChatHistory: (messages) => onChatHistory(messages),
      onChatError: (error) => onChatError(error),
    });
  },
  component: () => App(Game(), Chat()),
  guard: async () => {
    const { playerId, status } = await fetchPlayerState();
    if (!playerId) return router.navigate("/lobby");
    if (status !== "room") return router.navigate("/waiting");
    return false;
  }
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
  resetChat();

  if (localStorage.getItem("bomberman:opponentsLeft")) {
    localStorage.removeItem("bomberman:opponentsLeft");
    const input = document.getElementById("nickname");
    if (input) input.value = localStorage.getItem("bomberman:nickname") ?? "";
    lobbyState.setState({ error: "All other players left the game." });
  }
}

// --- Waiting room polling -----------------------------------------

let tickTimer = null;

function wireWaiting() {
  // Start from a clean list; the socket immediately replies with the waiting
  // room's history, if there is any.
  resetChat();

  connectWebSocket(localStorage.getItem("bomberman:playerId"), {
    onQueueUpdate: (queuePosition, playerCount) => waitingState.setState({ playerCount }),
    onQueueTimer: (endsAt) => startTimerDisplay(endsAt, "Locking in players in"),
    onCountdown: (endsAt) => startTimerDisplay(endsAt, "Game starts in"),
    onTimerCancelled: () => { clearInterval(tickTimer); waitingState.setState({ secondsLeft: null }); },
    onGameUpdate: () => { stopWaitingTimers(); setTimeout(() => router.navigate("/"), 200); },
    onChatMessage: (message) => onChatMessage(message),
    onChatHistory: (messages) => onChatHistory(messages),
    onChatError: (error) => onChatError(error),
    onError: (err) => console.error("WebSocket error", err),
  });
}

function startTimerDisplay(endsAt, timerLabel) {
  if (tickTimer) clearInterval(tickTimer);
  const tick = () => {
    const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    waitingState.setState({ timerLabel, secondsLeft });
    if (secondsLeft <= 0) clearInterval(tickTimer);
  };
  tick();
  tickTimer = setInterval(tick, 250);
}

function stopWaitingTimers() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
  waitingState.setState({ secondsLeft: null, timerLabel: "" });
}

// *******************************************************************


async function fetchPlayerState() {
  const playerId = localStorage.getItem("bomberman:playerId");
  if (!playerId) return { playerId: null };
  
  try {
    const data = await api.getPlayerStatus(playerId);
    return { playerId, ...data }; // { playerId, status, room?, queuePosition? }
  } catch {
    // Player no longer exists server-side (expired, left, server restarted).
    localStorage.removeItem("bomberman:playerId");
    localStorage.removeItem("bomberman:nickname");
    return { playerId: null };
  }
}

// **********************************************************************

window.addEventListener("pagehide", () => {
  // pagehide over beforeunload: it fires reliably on tab close, back/forward navigation,
  // and mobile Safari (where beforeunload is unreliable)
  closeWebSocket();
});

window.addEventListener("storage", (event) => {
  if (event.key !== "bomberman:playerId" || !event.newValue) return;

  const currentPath = location.hash.replace("#", "") || "/lobby";
  if (currentPath === "/lobby") {
    router.navigate("/waiting"); // its own guard resolves whether that's really /waiting or /
  }
});