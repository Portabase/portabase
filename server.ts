import next from "next";
import express from "express";

import router from "./src/features/api/router";

const port = Number(process.env.PORT) || 80;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, port: port, turbopack: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    server.use("/services/v1", router);


    server.use((req, res, next) => {
        if (req.path.startsWith('/services/v1')) return next();
        handle(req, res).catch((err) => {
            console.error('Next.js App Router error:', err);
            res.status(500).send('Internal Server Error');
        });
    });

    server.listen(port, () => {
        console.log(`Next.js App Router running at http://localhost:${port}`);
        console.log(`Express API running at http://localhost:${port}/express`);
    });
});
