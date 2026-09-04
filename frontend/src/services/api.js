"use strict";

const API_BASE = "http://localhost:8080";

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export function getConfig() {
    return request(`/api/config`);
}

export function joinQueue(nickname) {
    return request("/api/players", {
        method: "POST",
        body: JSON.stringify({ nickname }),
    });
}

export function getPlayerStatus(playerId) {
    return request(`/api/players/${playerId}`);
}

export function leaveQueue(playerId) {
    return request(`/api/players/${playerId}`, { method: "DELETE" });
}