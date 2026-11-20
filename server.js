import http from "node:http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

logging.set_level(logging.INFO);

// Optional: only accept connections from your own site. Set ALLOWED_ORIGINS on the host
// (comma separated), e.g.  https://coltjbennett.github.io   (origin only: no path, no trailing slash)
// Leave it unset to accept connections from anywhere.
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end("Wisp server is running.");
});

// Keep connections alive (Render's proxy drops idle sockets).
server.keepAliveTimeout = 65000;
server.headersTimeout = 70000;

server.on("upgrade", (req, socket, head) => {
  socket.on("error", () => {});
  const origin = (req.headers.origin || "").replace(/\/+$/, "");
  const path = (req.url || "").split("?")[0];
  // wisp-js only understands the trailing-slash form; "/wisp" alone is parsed as a hostname.
  const okPath = path.startsWith("/wisp/");
  const okOrigin = allowed.length === 0 || allowed.includes(origin);
  if (!okPath || !okOrigin) {
    console.log("Rejected upgrade: path=" + path + " origin=" + (origin || "(none)"));
    socket.destroy();
    return;
  }
  try {
    wisp.routeRequest(req, socket, head);
  } catch (err) {
    console.error("routeRequest failed:", err);
    socket.destroy();
  }
});

// A bad connection must never take the whole server down.
process.on("uncaughtException", err => console.error("uncaughtException:", err));
process.on("unhandledRejection", err => console.error("unhandledRejection:", err));

// Render sets PORT (10000 by default). Fall back to 10000 for local runs too.
const port = Number(process.env.PORT) || 10000;
server.listen(port, "0.0.0.0", () => console.log("Wisp server listening on port " + port));
