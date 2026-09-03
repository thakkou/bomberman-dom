import { CHAT_MAX_LENGTH, CHAT_HISTORY_LIMIT, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS } from "./config.js";

const rateLimits = new Map(); // playerId -> timestamps[]

export function sanitizeMessage(raw) {
    if (typeof raw !== "string") return null;

    // Strip control/non-printable characters; keep normal unicode text & emoji.
    const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (!cleaned) return null;
    if (cleaned.length > CHAT_MAX_LENGTH) return null;

    return cleaned;
}

export function isRateLimited(playerId) {
    const now = Date.now();
    const recent = (rateLimits.get(playerId) || []).filter(t => now - t < CHAT_RATE_WINDOW_MS);
    recent.push(now);
    rateLimits.set(playerId, recent);
    return recent.length > CHAT_RATE_LIMIT;
}

export function clearRateLimit(playerId) {
    rateLimits.delete(playerId);
}

export function appendToHistory(room, message) {
    room.chat = room.chat || [];
    room.chat.push(message);
    if (room.chat.length > CHAT_HISTORY_LIMIT) room.chat.shift();
}