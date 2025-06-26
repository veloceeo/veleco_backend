import express from "express";
import jwt from "jsonwebtoken";

export const authSellerMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        if(decode.role!=="seller") {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        req.userId = decode.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
    }
};


export const authAdminMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        if (decode.role !== 'admin') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        req.userId = decode.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
    }
}

export const authUserMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        if (decode.role !== 'user') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        req.userId = decode.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
    }
}