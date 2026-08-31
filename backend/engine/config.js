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

// Fixed walls — same pattern for every game, every room.
export const WALLS = new Set([
    20, 22, 24, 26, 28, 30, 32, 34, 36, 58, 60, 62, 64, 66, 68, 70, 72, 74,
    96, 98, 100, 102, 104, 106, 108, 110, 112, 134, 136, 138, 140, 142, 144,
    146, 148, 150, 172, 174, 176, 178, 180, 182, 184, 186, 188,
]);