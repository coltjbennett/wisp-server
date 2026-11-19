import http from "node:http";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";

logging.set_level(logging.INFO);

// Optional: only accept connections from your own site. Set the ALLOWED_ORIGINS environment
// variable on the host (comma separated), e.g.  https://coltjbennett.github.io
// Leave it unset to accept connections from anywhere.
const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Wisp server is running.");
});

server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin || "";
  const okPath = (req.url || "").startsWith("/wisp/");
  const okOrigin = allowed.length === 0 || allowed.includes(origin);
  if (!okPath || !okOrigin) { socket.destroy(); return; }
  wisp.routeRequest(req, socket, head);
});

const port = process.env.PORT || 5001;
server.listen(port, "0.0.0.0", () => console.log("Wisp server listening on port " + port));
