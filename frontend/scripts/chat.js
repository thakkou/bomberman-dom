"use strict";

// const chatForm = document.getElementById("chat-form");

export function sendMessage() {
  const chatNameInput = document.getElementById("chat-name");
  const chatMessageInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  
  const name = chatNameInput.value.trim() || "Player";
  const message = chatMessageInput.value.trim();
  if (!message) return;
  
  document.getElementById("chat-empty")?.remove();
  
  const messageElement = document.createElement("p");
  messageElement.className = "chat-message";
  
  const authorElement = document.createElement("strong");
  authorElement.textContent = `${name}: `;
  messageElement.append(authorElement, document.createTextNode(message));
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatMessageInput.value = "";
  chatMessageInput.focus();
}