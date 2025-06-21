import express from "express"
import { PrismaClient } from "../db/generated/prisma";
import jwt from "jsonwebtoken"
import * as OTPAuth from "otpauth";

// Extend Express Request interface to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: any;
        }
    }
}

let topo = new OTPAuth.TOTP({
    issuer:"ACME",
    label:"kanha",
    algorithm:"SHA1",
    digits:6,
    period:30,
    secret:"hello"
});

let secret = new OTPAuth.Secret({size:30})
let token = topo.generate()
let validate = topo.validate({token,window:1});
console.log(topo.generate());
console.log(validate)

const user = express.Router();

user.use(express.json());

const prisma = new PrismaClient()

// Middleware to verify JWT token
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const header = req.headers['auth'] as string;

    if (!header) {
        res.status(401).json({ error: 'No auth token provided' });
        return;
    }

    try {
        const decode = jwt.verify(header, "hello") as any;
        req.userId = decode.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
        return;
    }
};

// Public routes (no authentication required)
user.get("/login", (req, res) => {
    res.send("Login page");
});

user.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = await prisma.user.findFirst({
            where: {
                email: email,
            }
        });

        if (!users) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // TODO: Add password verification here
        res.send(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

user.post("/signup", async (req, res) => {
    try {
        const { email, password, phone, role, name } = req.body;

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password,
                phone,
                role,
                created_At: new Date()
            }
        });

        const token = jwt.sign({ id: user.id, email: user.email }, "hello");
        res.send({ token, user });
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user' });
    }
});

// Protected routes (authentication required)
user.get("/", authMiddleware, (req, res) => {
    res.send({ userId: req.userId });
});


user.put("/forget", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.update({
        where: {
            email
        },
        data: {
            password: password
        }

    })
    res.send("update password");
})
export default user;