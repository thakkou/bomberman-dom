"use strict";

import { renderElement } from "mini-framework/src/vdom/index.js";

import hudState from "../state/hudState.js";

// Components
import HudPlayerRow from "../components/HudPlayerRow.js";
import PowerupBadge from "../components/PowerupBadge.js";

export function renderHud() {
    const container = document.getElementById("hud-players");
    const powerupsContainer = document.getElementById("hud-powerups-bar");
    const messageEl = document.getElementById("game-message");
    if (!container) return;

    const { players, myPlayerId, message } = hudState.getState();

    const rows = Object.entries(players).map(([playerId, player], i) =>
        HudPlayerRow(playerId, player, i, myPlayerId)
    );
    renderElement(true, container, ...rows);

    const me = players[myPlayerId];
    if (powerupsContainer && me) {
        renderElement(true, powerupsContainer,
            PowerupBadge("💣", me.maxBombs, "Bombs"),
            PowerupBadge("🔥", me.blastRange, "Range"),
            PowerupBadge("⚡", me.speedLevel, "Speed"),
        );
    }

    if (messageEl) {
        messageEl.textContent = message || "Move with Arrow keys or WASD. Drop a bomb with Space.";
    }
}