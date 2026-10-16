import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const path = resolve(root, requested);
  if (path !== root && !path.startsWith(root + sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  if (!existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": mime[extname(path)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  });
  createReadStream(path).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`DOTS Living Worlds v0.1 available at http://localhost:${port}`);
});
