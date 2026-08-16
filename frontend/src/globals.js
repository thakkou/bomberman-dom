// import Router from "mini-framework/src/router.js";
// import createState from "mini-framework/src/stateManager.js";

// export const router = Router();

// export const data = createState({
//   count: 0,
// });

// // ---------- Config ----------
// export const COLS = 15, ROWS = 13;
// export const TILE = 36;
// export const CANVAS_W = COLS * TILE, CANVAS_H = ROWS * TILE;

// export const EMPTY = 0, WALL = 1, SOFT = 2;

// export const canvas = document.getElementById("game");
// canvas.width = CANVAS_W;
// canvas.height = CANVAS_H;
// export const ctx = canvas.getContext("2d");

// export const overlay = document.getElementById("overlay");
// export const overlayTitle = document.getElementById("overlayTitle");
// export const overlayText = document.getElementById("overlayText");
// export const overlayBtn = document.getElementById("overlayBtn");
// export const toastEl = document.getElementById("toast");

// export const statLevel = document.getElementById("statLevel");
// export const statScore = document.getElementById("statScore");
// export const statEnemies = document.getElementById("statEnemies");
// export const statBombs = document.getElementById("statBombs");
// export const statRange = document.getElementById("statRange");
// export const livesRow = document.getElementById("livesRow");
// export const restartBtn = document.getElementById("restartBtn");

// // ---------- Game state ----------
// export let grid = [];
// export let bombs = [];      // {x,y,timer,range,owner}
// export let explosions = []; // {x,y,life}
// export let powerups = [];   // {x,y,type}
// export let enemies = [];    // {x,y,dir,moveT}
// export let player;
// export let level = 1;
// export let score = 0;
// export let lives = 3;
// export let paused = false;
// export let gameOver = false;
// export let exitTile = null;
// export let exitOpen = false;
// export let keys = {};
// export let lastTime = 0;
// export let toastTimer = null;