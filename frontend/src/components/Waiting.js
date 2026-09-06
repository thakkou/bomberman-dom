"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";
import waitingState from "../state/waitingState.js";

export default function Waiting() {
    const { playerCount, timerLabel, secondsLeft } = waitingState.getState();

    return createElement(
        "section",
        { class: "waiting-container", "aria-label": "Waiting room" },
        {},
        createElement("h1", { class: "waiting-title" }, {}, "BOMBERMAN"),
        createElement("p", { class: "waiting-subtitle" }, {}, "Waiting for other players..."),
        createElement(
            "div",
            { class: "player-counter", "aria-live": "polite" },
            {},
            createElement("span", {}, {}, String(playerCount)),
            createElement("span", { class: "player-total" }, {}, "/ 4"),
        ),
        createElement("p", { class: "counter-label" }, {}, "Players joined"),
        secondsLeft !== null
            ? createElement("p", { class: "waiting-status", "aria-live": "polite" }, {}, `${timerLabel} ${secondsLeft}s`)
            : null,
        createElement("button", { class: "btn-leave", type: "button" }, { click: leaveWaiting }, "Leave"),
    );
}

async function leaveWaiting() {
    const { router } = await import("../main.js");
    const { leaveQueue } = await import("../services/api.js");
    const playerId = localStorage.getItem("bomberman:playerId");
    if (playerId) await leaveQueue(playerId).catch(() => {});
    localStorage.removeItem("bomberman:playerId");
    localStorage.removeItem("bomberman:nickname");
    router.navigate("/lobby");
}