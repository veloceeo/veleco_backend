import express from "express"
import { PrismaClient, } from "../../db/generated/prisma";
import jwt from "jsonwebtoken"
import * as OTPAuth from "otpauth";
import z from "zod";
import dotenv from "dotenv";

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

 export const otpSchema = z.object({
    otp: z.string()
})
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
    phone: z.string(),
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
        const { email, password, phone,  name } = signupSchema.parse(req.body);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password,
                phone,
                created_At: new Date()
            }
        });
        if (!user) {
            res.status(400).json({ error: 'Failed to create user' });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "hello");
           if (user.type === "user") {
            console.log("Admin user created:", user.email);
        }
        
        const session = await prisma.session.create({
            data: {
                user_id: user.id,
                session_date: new Date(),
            }
        });
        if (!session) {
            res.status(500).json({ error: 'Failed to create session' });
            return;
        }
        console.log("Session created for user:", session);
        res.send({ token, user });
     
    } catch (error) {
        res.status(400).json({ error: 'Failed to create user' });
    }
});

// Protected routes (authentication required)
user.get("/",  (req, res) => {
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


user.post("/logout", async (req, res) => {
    try {
        const token = req.headers["auth"];

        const decode = jwt.verify(token as string, process.env.JWT_SECRET || "hello") as { id: number, email: string };
        req.userId = decode.id;
        console.log("Token:", decode.id, decode.email);
        if (!token) {
             res.status(401).json({ error: 'Unauthorized' });
        }
                // You need to get the session id for the user before updating
                const session = await prisma.session.findFirst({
                    where: {
                        user_id: decode.id,
                        
                    },
                    orderBy: {
                        session_date: 'desc' // Get the most recent session
                    }
                });
                console.log("Session found:", session);
                if (!session) {
                     res.status(404).json({ error: 'Active session not found' });
                }

                // const updatedSession = await prisma.session.update({
                //     where: {
                //         id: session?.id,
                //         is_active: true // Ensure the session is active

                //     },
                //     data: {
                //         is_active: false, // Mark the session as inactive
                //         last_activity: new Date() // Update last activity time
                //     }
                // });
                // if (!updatedSession) {
                //      res.status(500).json({ error: 'Failed to update session' });
                // }
                // Invalidate the token by not returning it or by using a blacklist strategy
                res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log("Error during logout:", error);
    }
});

export default user;