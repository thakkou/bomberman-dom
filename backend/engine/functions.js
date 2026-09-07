"use strict";

import crypto from "node:crypto";

import * as state from "./globals.js";

// ============================================================
// Utility functions
// ============================================================

export function createPlayer(nickname) {
    return {
        id: crypto.randomUUID(),
        nickname,
        lives: 3,
        score: 0
    };
}

export function createRoom(roomPlayers) {
    return {
        id: crypto.randomUUID(),
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