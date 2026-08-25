import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const INDEX_PATH = path.join(__dirname, "index.html");

const server = http.createServer(async (req, res) => {
    async function serveFile(filepath, contentType) {
        try {
            const content = await fs.readFile(filepath);
        
            res.writeHead(200, {
                "Content-Type": contentType,
                "Content-Length": content.length,
            });
        
            res.end(content);
        } catch (error) {
            console.error(error);

            res.writeHead(500, {
                "Content-Type": "text/plain; charset=utf-8",
            });

            res.end("Internal Server Error");
        }
    }

    if (req.method === "GET") {
        if (req.url === "/") {
            await serveFile(INDEX_PATH, "text/html; charset=utf-8");
        } else if (req.url.startsWith("/styles/")) {
            let filepath = path.join(__dirname, req.url.slice(1));
            await serveFile(filepath, "text/css;");
        } else if (req.url.startsWith("/scripts/") || req.url.startsWith("/components/") || req.url.startsWith("/node_modules/")) {
            let filepath = path.join(__dirname, req.url.slice(1));
            await serveFile(filepath, "text/javascript;");
        } else if (req.url.startsWith("/public/")) {
            let filepath = path.join(__dirname, req.url.slice(1));
            await serveFile(filepath, "image/x-icon;");
        } else {
            res.writeHead(404, {
                "Content-Type": "text/plain; charset=utf-8",
            });
            res.end("Not Found");
        }
    }
});

server.listen(PORT, () => {
    console.log(`FRONTEND: http://localhost:${PORT}`);
});