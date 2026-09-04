// ============================================================
// Config
// ============================================================

export const PLAYERS_PER_ROOM = 4;
export const BOARD_COLUMNS = 19;
export const BOARD_SIZE = 209;
export const START_POSITION = 0;
export const STARTING_LIVES = 3;
export const BOX_SCORE = 100;
export const BOMB_DELAY = 1800;
export const EXPLOSION_TIME = 450;
export const BLAST_RANGE = 2;

export const QUEUE_WAIT_MS = 20_000; // max wait before locking in whoever's queued
export const COUNTDOWN_MS = 10_000;  // "get ready" countdown before the game starts

// Fixed walls — same pattern for every game, every room.
export const WALLS = new Set([
    20, 22, 24, 26, 28, 30, 32, 34, 36, 58, 60, 62, 64, 66, 68, 70, 72, 74,
    96, 98, 100, 102, 104, 106, 108, 110, 112, 134, 136, 138, 140, 142, 144,
    146, 148, 150, 172, 174, 176, 178, 180, 182, 184, 186, 188,
]);

// CHAT
export const CHAT_MAX_LENGTH = 300;
export const CHAT_HISTORY_LIMIT = 50;
export const CHAT_RATE_LIMIT = 5; // messages
export const CHAT_RATE_WINDOW_MS = 5000; // per this many ms
export const WS_MAX_PAYLOAD_BYTES = 4 * 1024; // reject oversized frames before they're even parsed


// power-up + movement tuning

export const POWERUP_DROP_CHANCE = 0.3; // 30% chance a destroyed box drops one
export const POWERUP_TYPES = ["bombs", "flames", "speed"];

export const MAX_BOMBS_CAP = 8;
export const MAX_BLAST_RANGE_CAP = 8;
export const MAX_SPEED_LEVEL = 5;

export const BASE_MOVE_COOLDOWN_MS = 220; // ms between moves at speedLevel 0
export const SPEED_COOLDOWN_STEP_MS = 30; // cooldown reduction per speed level
export const MIN_MOVE_COOLDOWN_MS = 80;   // floor so speed can't go infinite