"use strict";

import { patchDOM } from "mini-framework/src/vdom/index.js";

import chatState from "../state/chatState.js";
import Chat from "../components/Chat.js";

import { router } from "../main.js";

export function onChatMessage(message) {
  chatState.setState({ messages: [...chatState.getState().messages, message] });
}

export function onChatHistory(messages) {
  chatState.setState({ messages });
}

export function onChatError(error) {
  chatState.setState({ error });
}

export function resetChat() {
  chatState.setState({ messages: [], error: "" });
}

// export function patchChat() {
//   const target = document.getElementById('chat-component');
//   if (target) patchDOM(router, target, Chat());
// }