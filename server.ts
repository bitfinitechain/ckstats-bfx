import 'dotenv/config';
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { startPoller } from "./src/lib/poller";
import { initRedis } from "./src/lib/redis";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3004; // User specified 3004 in context previously or implies fresh port. ckstats-bfx had 3004.
// bitfinite-web on 3001.
// Let's use 3004.

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    await initRedis();

    const server = createServer();

    // Initialize Socket.io and attach to server
    const io = new Server(server, {
        path: "/socket.io",
        addTrailingSlash: false,
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    server.on("request", async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);

            // Let Socket.io handle its own requests
            // Since io is attached to server, it adds its own listener.
            // We just need to make sure we don't interfere (e.g. Next.js 404ing it).
            if (parsedUrl.pathname?.startsWith("/socket.io")) {
                return;
            }

            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    io.on("connection", (socket) => {
        console.log("Client connected", socket.id);
        socket.emit("connected", { status: "ok" });
    });

    // Start the background poller
    startPoller(io);

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
