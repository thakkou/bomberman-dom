import { BOARD_COLUMNS, BOARD_SIZE, STARTING_LIVES, BOMB_DELAY, BLAST_RANGE, BOX_SCORE, WALLS } from "./config.js";
import { getSpawnPositions, generateBoxes } from "./map.js";

export function createGameState(playerIds) {
    const spawns = getSpawnPositions(playerIds.length);
    const players = {};

    playerIds.forEach((playerId, i) => {
        players[playerId] = { position: spawns[i], lives: STARTING_LIVES, score: 0, alive: true };
    });

    return {
        boxes: generateBoxes(playerIds.length),
        bombs: new Map(),  // position -> { ownerId, timer }
        explosions: new Set(),
        players,
        winnerId: null,
    };
}

function isValidMove(game, from, to) {
    if (to < 0 || to >= BOARD_SIZE) return false;
    if (Math.abs(to - from) === 1 &&
        Math.floor(to / BOARD_COLUMNS) !== Math.floor(from / BOARD_COLUMNS)) return false;
    if (WALLS.has(to) || game.boxes.has(to) || game.bombs.has(to)) return false;
    for (const other of Object.values(game.players)) {
        if (other.alive && other.position === to) return false; // players block each other
    }
    return true;
}

export function movePlayer(game, playerId, direction) {
    const player = game.players[playerId];
    if (!player || !player.alive) return false;

    const offset = { left: -1, right: 1, up: -BOARD_COLUMNS, down: BOARD_COLUMNS }[direction];
    if (offset === undefined) return false;

    const nextPosition = player.position + offset;
    if (!isValidMove(game, player.position, nextPosition)) return false;

    player.position = nextPosition;
    if (game.explosions.has(nextPosition)) applyHit(game, playerId);
    return true;
}

export function placeBomb(game, playerId, onExplode) {
    const player = game.players[playerId];
    if (!player || !player.alive) return false;
    if (game.bombs.has(player.position)) return false;

    const position = player.position;
    const timer = setTimeout(() => onExplode(position), BOMB_DELAY);
    game.bombs.set(position, { ownerId: playerId, timer });
    return true;
}

function blastPositions(game, origin) {
    const positions = [origin];
    for (const direction of [-1, 1, -BOARD_COLUMNS, BOARD_COLUMNS]) {
        for (let distance = 1; distance <= BLAST_RANGE; distance++) {
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

export function explodeBomb(game, position) {
    const bomb = game.bombs.get(position);
    if (!bomb) return { blast: [] };

    clearTimeout(bomb.timer);
    game.bombs.delete(position);

    const owner = game.players[bomb.ownerId];
    const blast = blastPositions(game, position);

    for (const cell of blast) {
        game.explosions.add(cell);
        if (game.boxes.delete(cell) && owner) owner.score += BOX_SCORE;
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
    return {
        boxes: [...game.boxes],
        bombs: [...game.bombs.keys()],
        explosions: [...game.explosions],
        players: game.players,
        winnerId: game.winnerId,
    };
}