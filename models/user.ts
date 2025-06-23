import express from "express"
import { PrismaClient, Role } from "../db/generated/prisma";
import jwt from "jsonwebtoken"
import * as OTPAuth from "otpauth";
import z from "zod";
import dotenv from "dotenv";
import { authMiddleware } from "./auth/middleware";

dotenv.config();

declare global {
    namespace Express {
        interface Request {
            userId?: any;
        }
    }
}
let topo = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "kanha",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: "JBSWY3DPEHPK3PXP"
});

const otpSchema = z.object({
    otp: z.string()
})
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
    phone: z.string(),
    role: z.nativeEnum(Role)
})
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})
const user = express.Router();

user.use(express.json());

const prisma = new PrismaClient()

// Middleware to verify JWT token

const generateOtp = () => {
    const otp = topo.generate();
    console.log(otp);
    return otp;
}

// Public routes (no authentication required)
user.get("/generate-otp", (req, res) => {
    const otp = generateOtp();
    res.json({ otp });
});

user.get("/login", (req, res) => {
    try {
        const { otp } = otpSchema.parse(req.headers)
        if (!otp) {
            res.send("No otp");
            return;
        }

        const verify = topo.validate({ token: otp as string, window: 1 });
        if (verify === null) {
            res.send("Invalid otp");
            return;
        }
        res.send("Login successful");
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

user.post("/login", async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

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
        const { email, password, phone, role, name } = signupSchema.parse(req.body);

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

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "hello");
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
    try{
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.update({
        where: {
            email
        },
        data: {
            password: password
        }

    })
    res.json({ message: "update password", user: user.email });
}
catch (error) {
    res.status(500).json({ error: 'Internal server error' });
}
})
export default user;