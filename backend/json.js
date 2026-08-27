// ============================================================
// Request body
// ============================================================

export async function readJsonBody(req) {
    let body = "";

    for await (const chunk of req) {
        body += chunk;
        // Don't accept arbitrarily large requests.
        if (body.length > 10_000) {
            throw new Error("Request body too large.");
        }
    }

    if (!body) return {};
    return JSON.parse(body);
}


// ============================================================
// JSON responses
// ============================================================

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);

    setCorsHeaders(res);
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
}

export function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { error: message });
}

export function sendEmpty(res, statusCode = 204) {
    setCorsHeaders(res);
    res.writeHead(statusCode);
    res.end();
}