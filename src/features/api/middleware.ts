import {Request, Response, NextFunction} from "express";

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log(`[API - SERVICES - V1] Received ${req.method} request : ${req.url} at ${new Date().toISOString()}`);
    next();
}