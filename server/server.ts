import next from "next";
import express from "express";
import {mountApi} from "./api";
import http from "http";

const port = Number(process.env.PORT) || 8887;
const dev = process.env.NODE_ENV !== "production";

async function start() {
    const nextApp = next({
        dev,
        hostname: "0.0.0.0",
        turbopack: dev,
        port
    });

    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const app = express();

    app.use((req, res, next) => {
        req.setTimeout(0);
        res.setTimeout(0);
        next();
    });

    mountApi(app);

    app.use((req, res, next) => {
        if (req.path.startsWith('/services/v1')) return next();
        handle(req, res).catch((err) => {
            console.error('Next.js App Router error:', err);
            res.status(500).send('Internal Server Error');
        });
    });

    const server = http.createServer(app);

    server.setTimeout(0);
    server.headersTimeout = 0;
    server.requestTimeout = 0;
    server.keepAliveTimeout = 0;

    server.listen(port, "0.0.0.0", () => {
        console.log(`NEXT APP → http://localhost:${port}`);
        console.log(`API → http://localhost:${port}/services/v1`);
    });
}

start();
