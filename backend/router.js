export function createRouter() {
    const routes = [];

    function route(method, pattern, handler) {
        const paramNames = [];
        const regexStr = pattern.replace(/\/:([^/]+)/g, (_, name) => {
            paramNames.push(name);
            return "/([^/]+)";
        });
        const regex = new RegExp(`^${regexStr}$`);
        routes.push({ method, regex, paramNames, handler });
    }

    async function dispatch(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        for (const r of routes) {
            if (r.method !== req.method) continue;
            const match = pathname.match(r.regex);
            if (!match) continue;

            const params = {};
            r.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });

            await r.handler(req, res, { params, url });
            return true; // handled
        }
        return false; // no match
    }

    return { route, dispatch };
}