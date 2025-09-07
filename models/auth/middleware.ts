import express from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends express.Request {
    userId?: string; // Optional userId field to store the decoded user ID
    role?: string; // Optional role field to store the user's role
}

// Generic auth middleware used by most routes
export const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;
    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }
    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        // Attach identity for downstream handlers; do not enforce role here
        req.userId = decode.id;
        (req as any).role = decode.type || decode.role;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
    }
};

export const authUserMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        if(decode.type!=="USER") {
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
export const authSellerMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, process.env.JWT_SECRET || "hello") as any;
        if(decode.type!=="seller") {
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
        if (decode.type !== 'admin') {
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

// You can export a default or named middleware as needed, for example:
