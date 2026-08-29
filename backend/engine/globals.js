// ============================================================
// State
// ============================================================

// Players waiting to be assigned to a room (the queue order).
export const waitingQueue = [];

// All currently existing rooms.
export const rooms = new Map(); // roomId -> room

// playerId -> roomId
// quickly find which room a player belongs to.
export const playerRooms = new Map();

// playerId -> player
// Keeps player information independently from rooms.
export const players = new Map();