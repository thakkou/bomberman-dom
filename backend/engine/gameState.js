import {
    BOARD_COLUMNS, BOARD_SIZE, STARTING_LIVES, BOMB_DELAY, BLAST_RANGE, BOX_SCORE, WALLS,
    POWERUP_DROP_CHANCE, POWERUP_TYPES, MAX_BOMBS_CAP, MAX_BLAST_RANGE_CAP, MAX_SPEED_LEVEL,
    BASE_MOVE_COOLDOWN_MS, SPEED_COOLDOWN_STEP_MS, MIN_MOVE_COOLDOWN_MS,
} from "./config.js";
import { getSpawnPositions, generateBoxes } from "./map.js";

export function createGameState(playerIds, nicknames = {}) {
    const spawns = getSpawnPositions(playerIds.length);
    const players = {};

    playerIds.forEach((playerId, i) => {
        players[playerId] = {
            nickname: nicknames[playerId] ?? `Player ${i + 1}`,
            position: spawns[i], lives: STARTING_LIVES, score: 0, alive: true,
            maxBombs: 1, blastRange: BLAST_RANGE, speedLevel: 0, lastMoveAt: 0,
        };
    });

    return {
        boxes: generateBoxes(playerIds.length),
        bombs: new Map(),     // position -> { ownerId, timer, range }
        explosions: new Set(),
        powerups: new Map(),  // position -> "bombs" | "flames" | "speed"
        players,
        winnerId: null,
    };
}

function getMoveCooldown(player) {
    const cooldown = BASE_MOVE_COOLDOWN_MS - player.speedLevel * SPEED_COOLDOWN_STEP_MS;
    return Math.max(MIN_MOVE_COOLDOWN_MS, cooldown);
}

function isValidMove(game, from, to) {
    if (to < 0 || to >= BOARD_SIZE) return false;
    if (Math.abs(to - from) === 1 &&
        Math.floor(to / BOARD_COLUMNS) !== Math.floor(from / BOARD_COLUMNS)) return false;
    if (WALLS.has(to) || game.boxes.has(to) || game.bombs.has(to)) return false;
    for (const other of Object.values(game.players)) {
        if (other.alive && other.position === to) return false;
    }
    return true;
}

export function movePlayer(game, playerId, direction) {
    const player = game.players[playerId];
    if (!player || !player.alive) return false;

    const now = Date.now();
    if (now - player.lastMoveAt < getMoveCooldown(player)) return false;

    const offset = { left: -1, right: 1, up: -BOARD_COLUMNS, down: BOARD_COLUMNS }[direction];
    if (offset === undefined) return false;

    const nextPosition = player.position + offset;
    if (!isValidMove(game, player.position, nextPosition)) return false;

    player.position = nextPosition;
    player.lastMoveAt = now;

    if (game.powerups.has(nextPosition)) {
        applyPowerup(player, game.powerups.get(nextPosition));
        game.powerups.delete(nextPosition);
    }

    if (game.explosions.has(nextPosition)) applyHit(game, playerId);
    return true;
}

function applyPowerup(player, type) {
    if (type === "bombs") player.maxBombs = Math.min(MAX_BOMBS_CAP, player.maxBombs + 1);
    else if (type === "flames") player.blastRange = Math.min(MAX_BLAST_RANGE_CAP, player.blastRange + 1);
    else if (type === "speed") player.speedLevel = Math.min(MAX_SPEED_LEVEL, player.speedLevel + 1);
}

export function placeBomb(game, playerId, onExplode) {
    const player = game.players[playerId];
    if (!player || !player.alive) return false;
    if (game.bombs.has(player.position)) return false;

    const activeBombs = [...game.bombs.values()].filter(b => b.ownerId === playerId).length;
    if (activeBombs >= player.maxBombs) return false;

    const position = player.position;
    const range = player.blastRange; // locked in at placement time
    const timer = setTimeout(() => onExplode(position), BOMB_DELAY);
    game.bombs.set(position, { ownerId: playerId, timer, range });
    return true;
}

function blastPositions(game, origin, range) {
    const positions = [origin];
    for (const direction of [-1, 1, -BOARD_COLUMNS, BOARD_COLUMNS]) {
        for (let distance = 1; distance <= range; distance++) {
            const position = origin + direction * distance;
            if (position < 0 || position >= BOARD_SIZE) break;
            if (Math.abs(direction) === 1 &&
                Math.floor(position / BOARD_COLUMNS) !== Math.floor(origin / BOARD_COLUMNS)) break;
            if (WALLS.has(position)) break;
            positions.push(position);
            if (game.boxes.has(position)) break;
        }
    }
    return positions;
}

function maybeDropPowerup(game, position) {
    if (Math.random() >= POWERUP_DROP_CHANCE) return;
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    game.powerups.set(position, type);
}

export function explodeBomb(game, position) {
    const bomb = game.bombs.get(position);
    if (!bomb) return { blast: [] };

    clearTimeout(bomb.timer);
    game.bombs.delete(position);

    const owner = game.players[bomb.ownerId];
    const blast = blastPositions(game, position, bomb.range);

    for (const cell of blast) {
        game.explosions.add(cell);
        game.powerups.delete(cell); // a blast destroys any power-up caught in it too

        if (game.boxes.delete(cell)) {
            if (owner) owner.score += BOX_SCORE;
            maybeDropPowerup(game, cell);
        }
    }

    for (const [playerId, player] of Object.entries(game.players)) {
        if (player.alive && blast.includes(player.position)) applyHit(game, playerId);
    }

    // Chain reaction: any bomb caught in this blast explodes too.
    for (const cell of blast) {
        if (game.bombs.has(cell)) {
            const chained = explodeBomb(game, cell);
            blast.push(...chained.blast.filter(c => !blast.includes(c)));
        }
    }

    return { blast };
}

export function clearExplosion(game, cells) {
    for (const cell of cells) game.explosions.delete(cell);
}

function applyHit(game, playerId) {
    const player = game.players[playerId];
    if (!player || !player.alive) return;
    player.lives -= 1;
    if (player.lives <= 0) player.alive = false;
}

// undefined = still playing, null = draw (0 left alive), string = winner's playerId
export function checkWinner(game) {
    const alive = Object.entries(game.players).filter(([, p]) => p.alive);
    if (alive.length <= 1) return alive[0]?.[0] ?? null;
    return undefined;
}

export function serializeGame(game) {
    console.log(game.powerups)
    return {
        boxes: [...game.boxes],
        bombs: [...game.bombs.keys()],
        explosions: [...game.explosions],
        powerups: [...game.powerups.entries()].map(([position, type]) => ({ position, type })),
        players: game.players, // maxBombs / blastRange / speedLevel ride along automatically
        winnerId: game.winnerId,
    };
}