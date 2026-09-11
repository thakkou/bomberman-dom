"use strict";

import { WebSocketServer } from "ws";

import * as bman from "../engine/functions.js";
import * as state from "../engine/globals.js";
import { movePlayer, placeBomb, explodeBomb, clearExplosion, checkWinner, serializeGame } from "../engine/gameState.js";
import { EXPLOSION_TIME, WS_MAX_PAYLOAD_BYTES, DISCONNECT_GRACE_MS } from "../engine/config.js";
import { getQueueTimerStatus } from "../engine/matchmaking.js";
import * as matchmaking from "../engine/matchmaking.js";
import { sanitizeMessage, isRateLimited, clearRateLimit, appendToHistory } from "../engine/chat.js";

const socketsByPlayer = new Map();   // playerId -> Set<ws>  (one entry per open tab)
const disconnectTimers = new Map();  // playerId -> timeoutId (pending "really gone?" check)

export function createWebSocketServer(httpServer) {
    const wss = new WebSocketServer({
        server: httpServer,
        path: "/ws",
        maxPayload: WS_MAX_PAYLOAD_BYTES,
    });

    wss.on("connection", (ws, req) => {
        if (req.headers.origin !== "http://localhost:3000") {
            ws.close(4003, "Forbidden origin");
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const playerId = url.searchParams.get("playerId");
        const player = playerId && bman.getPlayer(playerId);

        if (!player) {
            ws.close(4001, "Unknown player");
            return;
        }

        registerSocket(playerId, ws);

        ws.on("message", (raw) => {
            let msg;
            try { msg = JSON.parse(raw); } catch { return; }
            handleGameMessage(playerId, msg);
        });

        sendCurrentStatus(playerId);

        ws.on("close", () => unregisterSocket(playerId, ws));
        ws.on("error", () => unregisterSocket(playerId, ws));
    });

    return wss;
}

function registerSocket(playerId, ws) {
    // A new tab connecting cancels any pending "player fully left" cleanup —
    // this is what makes a page refresh (brief close-then-reconnect) safe.
    if (disconnectTimers.has(playerId)) {
        clearTimeout(disconnectTimers.get(playerId));
        disconnectTimers.delete(playerId);
    }
    if (!socketsByPlayer.has(playerId)) socketsByPlayer.set(playerId, new Set());
    socketsByPlayer.get(playerId).add(ws);
}

function unregisterSocket(playerId, ws) {
    const sockets = socketsByPlayer.get(playerId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size > 0) return; // other tabs for this player are still open

    socketsByPlayer.delete(playerId);
    const timer = setTimeout(() => {
        disconnectTimers.delete(playerId);
        removePlayer(playerId);
    }, DISCONNECT_GRACE_MS);
    disconnectTimers.set(playerId, timer);
}

function send(playerId, payload) {
    const sockets = socketsByPlayer.get(playerId);
    if (!sockets || sockets.size === 0) return;
    const data = JSON.stringify(payload);
    for (const ws of sockets) {
        if (ws.readyState === ws.OPEN) ws.send(data);
    }
}

export function closeAllSockets(playerId) {
    const sockets = socketsByPlayer.get(playerId);
    if (!sockets) return;
    for (const ws of sockets) ws.close(4000, "Player removed");
    socketsByPlayer.delete(playerId);
}

// Single source of truth for "this player is actually gone" — used by both
// an explicit Leave click and the last-tab-disconnected grace-period timeout.
export function removePlayer(playerId) {
    clearRateLimit(playerId);
    const player = bman.getPlayer(playerId);
    if (!player) return false;

    const queueIndex = state.waitingQueue.indexOf(playerId);
    if (queueIndex !== -1) {
        state.waitingQueue.splice(queueIndex, 1);
        state.players.delete(playerId);
        matchmaking.onPlayerLeftQueue();
        closeAllSockets(playerId);
        return true;
    }

    const roomId = state.playerRooms.get(playerId);
    if (roomId) {
        const room = bman.getRoom(roomId);
        state.playerRooms.delete(playerId);
        state.players.delete(playerId);

        if (room) {
            const index = room.players.indexOf(playerId);
            if (index !== -1) room.players.splice(index, 1);
            if (room.game?.players) delete room.game.players[playerId];

            if (room.players.length === 0) {
                if (room.countdownTimer) clearTimeout(room.countdownTimer);
                state.rooms.delete(room.id);
            } else if (room.players.length === 1 && room.state !== "finished") {
                const lastPlayerId = room.players[0];
                if (room.countdownTimer) clearTimeout(room.countdownTimer);
                broadcastOpponentsLeft(lastPlayerId);
                state.playerRooms.delete(lastPlayerId);
                state.players.delete(lastPlayerId);
                state.rooms.delete(room.id);
                closeAllSockets(lastPlayerId);
            } else {
                broadcastGameUpdate(room);
            }
        }

        closeAllSockets(playerId);
        return true;
    }

    state.players.delete(playerId);
    closeAllSockets(playerId);
    return true;
}

export function broadcastQueuePositions(playerIds) {
    const playerCount = state.waitingQueue.length;
    for (const playerId of playerIds) {
        send(playerId, {
            type: "queue_update",
            queuePosition: bman.getQueuePosition(playerId),
            playerCount,
        });
    }
}

function sendCurrentStatus(playerId) {
    const roomId = state.playerRooms.get(playerId);
    if (roomId) {
        const room = bman.getRoom(roomId);
        if (room) {
            broadcastGameUpdate(room);
            if (room.chat?.length) send(playerId, { type: "chat_history", messages: room.chat });
        }
        return;
    }

    broadcastQueuePositions([playerId]);
    // Catch the player up on the conversation happening in the waiting area.
    if (state.lobby.chat.length && state.waitingQueue.includes(playerId)) {
        send(playerId, { type: "chat_history", messages: state.lobby.chat });
    }
    const { queueEndsAt } = getQueueTimerStatus();
    if (queueEndsAt) send(playerId, { type: "queue_timer", endsAt: queueEndsAt }); // import queueEndsAt getter, see below
}

// -------------------------------
// game functions
// ------------------------------

function handleChatMessage(playerId, msg) {
    const roomId = state.playerRooms.get(playerId);
    const room = roomId && bman.getRoom(roomId);
    // Before a room exists the player is still queued: their chat goes to the
    // waiting area and is carried into the room once the queue is locked.
    const waiting = !room && state.waitingQueue.includes(playerId);
    if (!room && !waiting) return;

    if (isRateLimited(playerId)) {
        send(playerId, { type: "chat_error", error: "You're sending messages too fast." });
        return;
    }

    const text = sanitizeMessage(msg.text);
    if (!text) {
        send(playerId, { type: "chat_error", error: "Message is empty or too long." });
        return;
    }

    const player = bman.getPlayer(playerId);
    const chatMessage = { playerId, nickname: player?.nickname ?? "Unknown", text, sentAt: Date.now() };

    if (room) {
        appendToHistory(room, chatMessage);
        broadcastChatMessage(room, chatMessage);
    } else {
        appendToHistory(state.lobby, chatMessage);
        broadcastLobbyChatMessage(chatMessage);
    }
}

export function broadcastChatMessage(room, chatMessage) {
    const payload = { type: "chat_message", message: chatMessage };
    for (const playerId of room.players) send(playerId, payload);
}

function broadcastLobbyChatMessage(chatMessage) {
    const payload = { type: "chat_message", message: chatMessage };
    for (const playerId of state.waitingQueue) send(playerId, payload);
}

function handleGameMessage(playerId, msg) {
    if (msg.type === "chat") { handleChatMessage(playerId, msg); return; }

    const roomId = state.playerRooms.get(playerId);
    const room = roomId && bman.getRoom(roomId);
    if (!room || room.state !== "playing" || !room.game) return;

    if (msg.type === "move" && movePlayer(room.game, playerId, msg.direction)) {
        broadcastGameUpdate(room);
        maybeEndGame(room);
    }

    if (msg.type === "bomb" && placeBomb(room.game, playerId, (position) => onBombExplode(room, position))) {
        broadcastGameUpdate(room);
    }
}

function onBombExplode(room, position) {
    const { blast } = explodeBomb(room.game, position);
    broadcastGameUpdate(room);
    maybeEndGame(room);
    setTimeout(() => {
        clearExplosion(room.game, blast);
        broadcastGameUpdate(room);
    }, EXPLOSION_TIME);
}

function maybeEndGame(room) {
    const winnerId = checkWinner(room.game);
    if (winnerId === undefined) return;
    room.game.winnerId = winnerId;
    room.state = "finished";
    broadcastGameUpdate(room);
}

export function broadcastGameUpdate(room) {
    const payload = {
        type: "game_update",
        game: serializeGame(room.game),
        roomState: room.state,
        countdownEndsAt: room.state === "starting" ? room.countdownEndsAt : undefined,
    };
    for (const playerId of room.players) send(playerId, payload);
}

export function broadcastOpponentsLeft(playerId) {
    send(playerId, { type: "opponents_left" });
}

// timers

export function broadcastQueueTimer(playerIds, endsAt) {
    for (const playerId of playerIds) send(playerId, { type: "queue_timer", endsAt });
}

export function broadcastCountdown(playerIds, endsAt) {
    for (const playerId of playerIds) send(playerId, { type: "countdown", endsAt });
}

export function broadcastTimerCancelled(playerIds, timer) {
    for (const playerId of playerIds) send(playerId, { type: "timer_cancelled", timer });
}