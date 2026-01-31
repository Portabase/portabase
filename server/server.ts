import next from "next";
import express from "express";
import {mountApi} from "./api";

const port = Number(process.env.PORT) || 8887;
const dev = process.env.NODE_ENV !== "production";

async function start() {
    const nextApp = next({
        dev,
        port,
        turbopack: true
    });

    const handle = nextApp.getRequestHandler();

    await nextApp.prepare();

    const server = express();

    mountApi(server);

    server.use((req, res, next) => {
        if (req.path.startsWith('/services/v1')) return next();
        handle(req, res).catch((err) => {
            console.error('Next.js App Router error:', err);
            res.status(500).send('Internal Server Error');
        });
    });

    server.listen(port,  () => {
        console.log(
            `NEXT APP → http://localhost:${port}`
        );
        console.log(
            `API → http://localhost:${port}/services/v1`
        );
    });
}

start();
