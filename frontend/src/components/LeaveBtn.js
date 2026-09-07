"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function LeaveBtn() {
    return createElement(
        "button",
        { class: "btn-leave", type: "button" },
        { click: leaveGame },
        "Leave"
    );
}

async function leaveGame() {
    const { router } = await import("../main.js");
    const { leaveQueue } = await import("../services/api.js");
    const playerId = localStorage.getItem("bomberman:playerId");
    if (playerId) await leaveQueue(playerId).catch(() => {});
    localStorage.removeItem("bomberman:playerId");
    localStorage.removeItem("bomberman:nickname");
    router.navigate("/lobby");
}