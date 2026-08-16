const COLS = 15, ROWS = 13;
const TILE = 36;
const CANVAS_W = COLS * TILE, CANVAS_H = ROWS * TILE;

const EMPTY = 0, WALL = 1, SOFT = 2;

const canvas = document.getElementById("game");
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");
const toastEl = document.getElementById("toast");

const statLevel = document.getElementById("statLevel");
const statScore = document.getElementById("statScore");
const statEnemies = document.getElementById("statEnemies");
const statBombs = document.getElementById("statBombs");
const statRange = document.getElementById("statRange");
const livesRow = document.getElementById("livesRow");
const restartBtn = document.getElementById("restartBtn");

// ---------- Game state ----------
let grid = [];
let bombs = [];      // {x,y,timer,range,owner}
let explosions = []; // {x,y,life}
let powerups = [];   // {x,y,type}
let enemies = [];    // {x,y,dir,moveT}
let player;
export let level = 1;
let score = 0;
let lives = 3;
let paused = false;
let gameOver = false;
let exitTile = null;
let exitOpen = false;
let keys = {};
let lastTime = 0;
let toastTimer = null;

export function buildLevel(lvl) {
    grid = [];
    for (let y = 0; y < ROWS; y++) {
        const row = [];
        for (let x = 0; x < COLS; x++) {
            if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) { row.push(WALL); }
            else if (x % 2 === 0 && y % 2 === 0) { row.push(WALL); }
            else { row.push(EMPTY); }
        }
        grid.push(row);
    }

    // keep spawn corner clear
    const clearZones = [[1, 1], [2, 1], [1, 2], [COLS - 2, ROWS - 2], [COLS - 3, ROWS - 2], [COLS - 2, ROWS - 3]];

    const softChance = 0.55 + Math.min(lvl * 0.02, 0.15);
    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            if (grid[y][x] === WALL) continue;
            if (clearZones.some(([cx, cy]) => cx === x && cy === y)) continue;
            if (Math.random() < softChance) grid[y][x] = SOFT;
        }
    }

    // exit hidden under a soft block far from spawn
    let ex, ey;
    do {
        ex = COLS - 2; ey = ROWS - 2;
    } while (false);
    grid[ey][ex] = SOFT;
    exitTile = { x: ex, y: ey };
    exitOpen = false;

    bombs = [];
    explosions = [];
    powerups = [];

    player = {
        x: 1, y: 1, px: 1 * TILE, py: 1 * TILE,
        moving: false, dir: "down",
        speed: 3.4,
        maxBombs: 1, activeBombs: 0, range: 1,
        alive: true, invuln: 0
    };

    enemies = [];
    const enemyCount = Math.min(2 + lvl, 7);
    let placed = 0, attempts = 0;
    while (placed < enemyCount && attempts < 500) {
        attempts++;
        const ex2 = 1 + Math.floor(Math.random() * (COLS - 2));
        const ey2 = 1 + Math.floor(Math.random() * (ROWS - 2));
        const dist = Math.abs(ex2 - 1) + Math.abs(ey2 - 1);
        if (grid[ey2][ex2] === EMPTY && dist > 4) {
            enemies.push({
                x: ex2, y: ey2, px: ex2 * TILE, py: ey2 * TILE,
                dir: ["up", "down", "left", "right"][Math.floor(Math.random() * 4)],
                speed: 1.6 + Math.random() * 0.6 + lvl * 0.05,
                alive: true, moveCooldown: Math.random() * 0.5
            });
            placed++;
        }
    }
}

export function draw() {}