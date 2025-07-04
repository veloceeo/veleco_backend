import express from "express"
import { PrismaClient } from "../../db/generated/prisma"
import z from "zod"
import * as OTPAuth from "otpauth";
import { otpSchema } from "./user";
import jwt from "jsonwebtoken";
import { authSellerMiddleware } from "../auth/middleware";
const seller = express.Router()

seller.use(express.json());

const otp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "veleco",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: "JBSWY3DPEHPK3PXP"
});
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
    phone: z.string(),
})

const prisma = new PrismaClient()
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    otp: z.string().optional()
})

seller.post("/signup", async (req, res) => {
    const { email, password, name, phone } = signupSchema.parse(req.body)
    if (!email || !password || !name || !phone) {
        res.send("Field Missing")
    }
    const user = await prisma.seller.create({
        data: {
            seller_email: email,
            seller_password: password,
            seller_name: name,
            seller_phone: phone,
            created_at: new Date()
        }
    })
    const token = jwt.sign({ id: user.id, email: user.seller_email, type: "seller" }, process.env.JWT_SECRET || "hello");
    res.setHeader("auth", token);
    console.log(token);
    console.log("Seller user created:", user.seller_email);
    console.log("Seller ID:", user.id);
    console.log(user.created_at)
    res.send("Seller Created Successfully")

})

seller.get("/generate-otp", (req, res) => {
    const otpCode = otp.generate();
    res.json({ otp: otpCode });
});

seller.post("/login",authSellerMiddleware, async (req, res) => {

    const { email, password } = loginSchema.parse(req.body);
    if (!email || !password) {
        res.send("required field")
    }
    const { otp } = otpSchema.parse(req.headers);
    if (!otp) {
        res.status(400).send("OTP is required");
        return;
    }
    console.log("userId",req.userId);
    const user = await prisma.seller.findFirst({
        where: {
            seller_email: email,
            seller_password: password
        }
    })
    if (user) {
        const timeResult = await prisma.seller.findUnique({
            where: {
                seller_email: email,
            },
            select: {
                created_at: true
            }
        });
        if (timeResult && timeResult.created_at < new Date())
                console.log(timeResult.created_at.toISOString().slice(0, 10))
            console.log("Current Date:", new Date().toISOString().slice(0, 10));
            console.log("active date:", timeResult?.created_at.toISOString().slice(0, 10));
            console.log(user.type);
            res.send("Login Successful")
    }
    else {
        res.status(401).send("Invalid credentials");
    }
})

seller.get("/profile", authSellerMiddleware, async (req, res) => {
    const sellerId = req.userId; // Assuming userId is set in the authSeller    
    if (!sellerId) {
         res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const sellerProfile = await prisma.seller.findUnique({
            where: { id: sellerId },
            select: {
                id: true,
                seller_email: true,
                seller_name: true,
                seller_phone: true,
                created_at: true
            }
        });

        if (!sellerProfile) {
             res.status(404).json({ error: "Seller not found" });
        }

        res.json(sellerProfile);
    } catch (error) {
        console.error("Error fetching seller profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
} );

seller.put("/change-password", authSellerMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6, "New password must be at least 6 characters long")
    }).parse(req.body);
    const sellerId = req.userId; // Assuming userId is set in the authSeller middleware
    if (!sellerId) {
         res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId }
        });

        if (!seller || seller.seller_password !== oldPassword) {
             res.status(401).json({ error: "Old password is incorrect" });
        }

        await prisma.seller.update({
            where: { id: sellerId },
            data: { seller_password: newPassword }
        });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Endpoint to change seller email
seller.put("/change-email", authSellerMiddleware, async (req, res) => {
    const { newEmail } = z.object({
        newEmail: z.string().email("Invalid email format")
    }).parse(req.body);
    const sellerId = req.userId; // Assuming userId is set in the authSeller middleware
    if (!sellerId) {
        res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId }
        });

        if (!seller) {
            res.status(404).json({ error: "Seller not found" });
        }

        await prisma.seller.update({
            where: { id: sellerId },
            data: { seller_email: newEmail }
        });

        res.json({ message: "Email changed successfully" });
    } catch (error) {
        console.error("Error changing email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to change seller phone number
seller.put("/change-phone", authSellerMiddleware, async (req, res) => {
    const { newPhone } = z.object({
        newPhone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must not exceed 15 digits")
    }).parse(req.body);
    const sellerId = req.userId; // Assuming userId is set in the authSeller middleware
    if (!sellerId) {
        res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId }
        });

        if (!seller) {
            res.status(404).json({ error: "Seller not found" });
        }

        await prisma.seller.update({
            where: { id: sellerId },
            data: { seller_phone: newPhone }
        });

        res.json({ message: "Phone number changed successfully" });
    } catch (error) {
        console.error("Error changing phone number:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Endpoint to delete seller account
seller.delete("/delete-account", authSellerMiddleware, async (req, res) => {
    const sellerId = req.userId; // Assuming userId is set in the authSeller middleware
    if (!sellerId) {
        res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId }
        });

        if (!seller) {
            res.status(404).json({ error: "Seller not found" });
        }

        await prisma.seller.delete({
            where: { id: sellerId }
        });

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



export default seller ;