import { WebSocketServer } from "ws";
import * as bman from "./engine/functions.js";
import * as state from "./engine/globals.js";

import { movePlayer, placeBomb, explodeBomb, clearExplosion, checkWinner, serializeGame } from "./engine/gameState.js";
import { EXPLOSION_TIME, WS_MAX_PAYLOAD_BYTES } from "./engine/config.js";
import { getQueueTimerStatus } from "./engine/matchmaking.js";
// import { getMatchmakingStatusFor } from "./engine/matchmaking.js";
// wsManager.js and matchmaking.js now import each other — that's fine in ES modules as long as neither calls the other at the top level (they don't; every call happens inside a function body).

import { sanitizeMessage, isRateLimited, clearRateLimit, appendToHistory } from "./engine/chat.js";

const sockets = new Map(); // playerId -> ws

export function createWebSocketServer(httpServer) {
    const wss = new WebSocketServer({
        server: httpServer,
        path: "/ws",
        maxPayload: WS_MAX_PAYLOAD_BYTES, // ws auto-closes (code 1009) anything larger, before parsing
    });
    // { server: httpServer, path: "/ws" } tells ws to hook into your existing http.Server's upgrade event automatically, scoped to /ws — no manual handshake code needed, and requests to other paths are left alone.

    wss.on("connection", (ws, req) => {
        if (req.headers.origin !== "http://localhost:3000") {
            ws.close(4003, "Forbidden origin");
            return;
        }
        const url = new URL(req.url, `http://${req.headers.host}`);
        const playerId = url.searchParams.get("playerId");
        const player = playerId && bman.getPlayer(playerId);

        if (!player) {
            console.log("[ws] closing — unknown player");
            ws.close(4001, "Unknown player");
            return;
        }

        sockets.set(playerId, ws);
        // console.log("[ws] registered, total sockets:", sockets.size);

        ws.on("message", (raw) => {
            let msg;
            try { msg = JSON.parse(raw); } catch { return; }
            handleGameMessage(playerId, msg);
        });

        sendCurrentStatus(playerId); // push current state immediately on connect

        ws.on("close", () => { sockets.delete(playerId); clearRateLimit(playerId); });
        ws.on("error", () => sockets.delete(playerId));
    });

    return wss;
}

function send(playerId, payload) {
    const ws = sockets.get(playerId);

    if (!ws) {
        // console.log(`[ws] no socket registered for player ${playerId}`);
        return;
    }

    // console.log(`[ws] readyState for ${playerId}:`, ws.readyState);
    // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

    if (ws.readyState !== ws.OPEN) {
        // console.log(`[ws] socket not open, skipping send`);
        return;
    }

    ws.send(JSON.stringify(payload));
    // console.log(`[ws] sent to ${playerId}:`, payload);
}

// export function broadcastToRoom(room) {
//     const payload = {
//         type: "room_update",
//         room: {
//             id: room.id,
//             state: room.state,
//             playerCount: room.players.length,
//             players: bman.getRoomPlayers(room),
//         },
//     };
//     for (const playerId of room.players) send(playerId, payload);
// }

export function broadcastQueuePositions(playerIds) {
    for (const playerId of playerIds) {
        send(playerId, {
            type: "queue_update",
            queuePosition: bman.getQueuePosition(playerId)
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
    const { queueEndsAt } = getQueueTimerStatus();
    if (queueEndsAt) send(playerId, { type: "queue_timer", endsAt: queueEndsAt }); // import queueEndsAt getter, see below
}

// -------------------------------
// game functions
// ------------------------------

function handleChatMessage(playerId, msg) {
    const roomId = state.playerRooms.get(playerId);
    const room = roomId && bman.getRoom(roomId);
    if (!room) return; // chat only exists once you're actually in a room

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

    appendToHistory(room, chatMessage);
    broadcastChatMessage(room, chatMessage);
}

export function broadcastChatMessage(room, chatMessage) {
    const payload = { type: "chat_message", message: chatMessage };
    for (const playerId of room.players) send(playerId, payload);
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