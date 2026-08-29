import { createElement } from "mini-framework/src/vdom/index.js";

import { sendMessage } from "../scripts/chat.js";

export default function Chat() {
    return createElement(
        "aside",
        { class: "messages-container", "aria-label": "Game chat" },
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
        ),
        createElement(
            "form",
            { class: "chat-form", id: "chat-form" },
            {
                submit: (event) => {
                    event.preventDefault();
                    sendMessage();
                }
            },
            createElement("label", { for: "chat-name" }, {}, "Name"),
            createElement("input", { id: "chat-name", maxlength: "20", placeholder: "Player", autocomplete: "nickname" }, {}),
            createElement("label", { for: "chat-input" }, {}, "Message"),
            createElement(
                "div",
                { class: "chat-send-row" },
                {},
                createElement("input", { id: "chat-input", maxlength: "160", placeholder: "Write a message...", autocomplete: "off" }, {}),
                createElement("button", { type: "submit" }, {}, "Send"),
            ),
        ),
    );
}