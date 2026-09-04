"use strict";

import { createElement } from "mini-framework/src/vdom/index.js";

export default function Chat() {
    return createElement(
        "section",
        { class: "messages-container", "aria-label": "Game chat" }, // id: "chat-container"
        {},
        createElement(
            "header",
            { class: "chat-header" },
            {},
            createElement("h2", {}, {}, "Game Chat"),
            createElement("p", { id: "game-message" }, {}, "Move with Arrow keys or WASD. Drop a bomb with Space."),
        ),
        createElement(
            "div",
            { class: "chat-messages", id: "chat-messages", "aria-live": "polite" },
            {},
            createElement("p", { class: "chat-empty", id: "chat-empty" }, {}, "No messages yet."),
            // ******************************************************
            createElement("ul", { class: "chat-messages", id: "chat-messages" }, {}),
            createElement("p", { class: "chat-error", id: "chat-error", "aria-live": "polite" }, {}, ""),
        ),
        createElement(
            "form",
            { class: "chat-form", id: "chat-form" },
            {},
            createElement(
                "div",
                { class: "chat-send-row" },
                {},
                createElement("input", { id: "chat-input", type: "text", maxlength: "300", placeholder: "Say something...", autocomplete: "off" }, {}),
                createElement("button", { type: "submit" }, {}, "Send"),
            ),
        ),
    );
}