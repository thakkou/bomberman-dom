import { WebSocketServer } from "ws";
import * as bman from "./engine/functions.js";
import * as state from "./engine/globals.js";

import { movePlayer, placeBomb, explodeBomb, clearExplosion, checkWinner, serializeGame } from "./engine/gameState.js";
import { EXPLOSION_TIME } from "./engine/config.js";

const sockets = new Map(); // playerId -> ws

export function createWebSocketServer(httpServer) {
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
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

        ws.on("close", () => sockets.delete(playerId));
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

export function broadcastToRoom(room) {
    const payload = {
        type: "room_update",
        room: {
            id: room.id,
            state: room.state,
            playerCount: room.players.length,
            players: bman.getRoomPlayers(room),
        },
    };
    for (const playerId of room.players) send(playerId, payload);
}

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
        if (room) broadcastToRoom(room);
    } else {
        broadcastQueuePositions([playerId]);
    }
}

// -------------------------------
// game functions
// ------------------------------

function handleGameMessage(playerId, msg) {
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
    const payload = { type: "game_update", game: serializeGame(room.game), roomState: room.state };
    for (const playerId of room.players) send(playerId, payload);
}