import crypto from "node:crypto";

import { PLAYERS_PER_ROOM } from "./config.js";
import * as state from "./globals.js";

// ============================================================
// Utility functions
// ============================================================

function generateId() {
    return crypto.randomUUID();
}

export function createPlayer(nickname) {
    return {
        id: generateId(),
        nickname,
        lives: 3,
        score: 0
    };
}

function createRoom(roomPlayers) {
    return {
        id: generateId(),
        players: roomPlayers,
        state: "waiting",
        createdAt: Date.now()
    };
}

export function getRoom(roomId) {
    return state.rooms.get(roomId);
}

export function getPlayer(playerId) {
    return state.players.get(playerId);
}

export function getQueuePosition(playerId) {
    const index = state.waitingQueue.indexOf(playerId);
    if (index === -1) return null;
    return index + 1;
}

export function getRoomPlayers(room) {
    return room.players.map(playerId => {
        return getPlayer(playerId);
    });
}


// ============================================================
// Queue
// ============================================================

export function processQueue() {
    // This function contains no await.
    // Therefore the entire operation runs synchronously.
    // Node.js cannot execute another request in the middle of this function.
    // This is what makes checking the queue + removing players
    // + creating rooms effectively atomic.
    const createdRooms = [];
    while (state.waitingQueue.length >= PLAYERS_PER_ROOM) {
        const playerIds = state.waitingQueue.splice(0, PLAYERS_PER_ROOM);
        const room = createRoom(playerIds);

        state.rooms.set(room.id, room);
        for (const playerId of playerIds) {
            state.playerRooms.set(playerId, room.id);
        }
        createdRooms.push(room);
        console.log(`Created room ${room.id} with ${playerIds.length} players`);
    }
    return createdRooms;
}


// ============================================================
// JSON responses
// ============================================================

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);

    setCorsHeaders(res);
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
}

export function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { error: message });
}

export function sendEmpty(res, statusCode = 204) {
    setCorsHeaders(res);
    res.writeHead(statusCode);
    res.end();
}


// ============================================================
// Request body
// ============================================================

export async function readJsonBody(req) {
    let body = "";

    for await (const chunk of req) {
        body += chunk;
        // Don't accept arbitrarily large requests.
        if (body.length > 10_000) {
            throw new Error("Request body too large.");
        }
    }

    if (!body) return {};
    return JSON.parse(body);
}