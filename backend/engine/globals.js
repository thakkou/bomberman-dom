"use strict";

// ============================================================
// State
// ============================================================

// Players waiting to be assigned to a room (the queue order).
export const waitingQueue = [];

// All currently existing rooms.
export const rooms = new Map(); // roomId -> room

// quickly find which room a player belongs to.
export const playerRooms = new Map(); // playerId -> roomId

// Keeps player information independently from rooms.
export const players = new Map(); // playerId -> player

// Chat for the waiting area (pseudo-room)
// When the queue is locked into a room the history moves into that room
// and is removed from here.
export const lobby = { chat: [] };