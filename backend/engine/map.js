import { BOARD_COLUMNS, BOARD_SIZE, BLAST_RANGE, WALLS } from "./config.js";

const BOARD_ROWS = BOARD_SIZE / BOARD_COLUMNS;

const CORNERS = [
    { row: 0, col: 0 },                              // top-left
    { row: 0, col: BOARD_COLUMNS - 1 },              // top-right
    { row: BOARD_ROWS - 1, col: 0 },                 // bottom-left
    { row: BOARD_ROWS - 1, col: BOARD_COLUMNS - 1 }, // bottom-right
];

function toIndex(row, col) {
    return row * BOARD_COLUMNS + col;
}

export function getSpawnPositions(playerCount) {
    return CORNERS.slice(0, playerCount).map(({ row, col }) => toIndex(row, col));
}

// Clears an L-shaped pocket (BLAST_RANGE deep, along the two open edges)
// around each corner so a player can survive dropping a bomb on their own spawn.
function safeZoneFor({ row, col }) {
    const cells = new Set([toIndex(row, col)]);
    const rowDir = row === 0 ? 1 : -1;
    const colDir = col === 0 ? 1 : -1;

    for (let step = 1; step <= BLAST_RANGE; step++) {
        cells.add(toIndex(row, col + colDir * step));
        cells.add(toIndex(row + rowDir * step, col));
    }
    return cells;
}

export function getSafeSpawnCells(playerCount) {
    const safe = new Set();
    for (const corner of CORNERS.slice(0, playerCount)) {
        for (const cell of safeZoneFor(corner)) safe.add(cell);
    }
    return safe;
}

export function generateBoxes(playerCount, amount = 100) {
    const safeCells = getSafeSpawnCells(playerCount);
    const available = [];

    for (let index = 0; index < BOARD_SIZE; index++) {
        if (!WALLS.has(index) && !safeCells.has(index)) available.push(index);
    }

    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    return new Set(available.slice(0, Math.min(amount, available.length)));
}