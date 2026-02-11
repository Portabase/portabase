import express from "express";
import router from "../src/features/api/router";

export function mountApi(app: express.Express) {
    app.use("/services/v1", router);
}