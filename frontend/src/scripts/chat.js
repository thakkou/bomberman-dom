"use strict";

import { sendChatMessage } from "../services/ws.js";

const MAX_LENGTH = 300;

export function wireChat() {
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const errorEl = document.getElementById("chat-error");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = input.value.trim();
        errorEl.textContent = "";

        if (!text) return;
        if (text.length > MAX_LENGTH) {
            errorEl.textContent = `Message must be ${MAX_LENGTH} characters or fewer.`;
            return;
        }

        sendChatMessage(text);
        input.value = "";
    });
}

export function renderChatHistory(messages) {
    const list = document.getElementById("chat-messages");
    if (!list) return;
    list.replaceChildren();
    for (const message of messages) appendChatMessage(message);
}

export function appendChatMessage(message) {
    const list = document.getElementById("chat-messages");
    if (!list) return;

    const item = document.createElement("li");
    item.className = "chat-message";

    const author = document.createElement("span");
    author.className = "chat-author";
    author.textContent = message.nickname; // textContent — never interpreted as HTML/script

    const body = document.createElement("span");
    body.className = "chat-text";
    body.textContent = message.text; // this line is the actual XSS defense

    item.append(author, document.createTextNode(": "), body);
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
}

export function showChatError(error) {
    const errorEl = document.getElementById("chat-error");
    if (errorEl) errorEl.textContent = error;
}