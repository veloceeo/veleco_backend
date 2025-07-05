import express from "express";
import { PrismaClient } from "../../db/generated/prisma";
import z from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as OTPAuth from "otpauth";
import mailer from "nodemailer";
const admin = express.Router();
const prisma = new PrismaClient();

admin.use(express.json());

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// OTP Configuration - Fixed secret key (base32 compatible)
const otp = new OTPAuth.TOTP({
    issuer: "E-Commerce Admin",
    label: "Admin Panel",
    algorithm: "SHA1",
    digits: 6,
    period: 300, // 5 minutes
    secret: "JBSWY3DPEHPK3PXP" // Valid base32 secret
});

// Alternative: Generate a random base32 secret
const generateBase32Secret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// You can also use this for a unique secret per admin:
// const adminOtpSecret = generateBase32Secret();

// Email utility function
export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    const transport = mailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.FROM_EMAIL||"kanhadewangan681@gmail.com", // Your email
            pass: process.env.EMAIL_PASSWORD||"qtgq sdrp nicr xwhq" // Your email password or app password
        }
    })
     const info = await transport.sendMail({
        from: "kanhadewangan681@gmail.com",
        to:to,
        subject: subject,    
        html: html,

     })
     console.log("Email sent:", info.messageId);    
}

// Validation Schemas
const adminSignupSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    adminKey: z.string().min(1, "Admin key is required"),
});

const adminLoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    otp: z.string().optional()
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const changeEmailSchema = z.object({
    newEmail: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    otp: z.string().min(6, "OTP is required")
});

// Middleware for admin authentication
const authAdminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
        const token = req.headers["auth"];
        if (!token || (Array.isArray(token) && token.length === 0)) {
            res.status(401).json({ error: "Access token required" });
            return;
        }

        const tokenString = Array.isArray(token) ? token[0] : token;
        if (!tokenString) {
            res.status(401).json({ error: "Invalid token format" });
            return;
        }
        
        const decoded = jwt.verify(tokenString, JWT_SECRET) as any;
        
        const admin = await prisma.admin.findFirst({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                is_active: true,
                type: true,
            }
        });

        if (!admin || admin.type !== "ADMIN" || !admin.is_active) {
            res.status(403).json({ error: "Admin access required" });
            return;
        }

        (req as any).user = admin;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
};

// ============ ADMIN SIGNUP ============
// TypeScript ignore for Express router type complexity
// @ts-ignore
admin.post("/signup", async (req, res) => {
    try {
        const validatedData = adminSignupSchema.parse(req.body);
        const { email, password, firstName, lastName, phone, adminKey } = validatedData;

        // Verify admin key
        const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || "SUPER_SECRET_ADMIN_KEY_2024";
        if (adminKey !== ADMIN_REGISTRATION_KEY) {
            return res.status(403).json({ error: "Invalid admin registration key" });
        }

        // Check if admin already exists
        const existingUser = await prisma.admin.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        const newAdmin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                first_name: firstName,
                last_name: lastName,
                phone,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                created_at: true,
                type: true
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newAdmin.id, 
                email: newAdmin.email, 
                role: newAdmin.type || "ADMIN" 
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Send welcome email
        try {
            await sendEmail({
                to: email,
                subject: "Welcome to Admin Panel - Account Created",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to the Admin Panel!</h2>
                        <p>Hello ${firstName} ${lastName},</p>
                        <p>Your admin account has been successfully created.</p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3>Account Details:</h3>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Role:</strong> Administrator</p>
                            <p><strong>Created:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>Please keep your credentials secure and follow all security protocols.</p>
                        <p>Best regards,<br>E-Commerce Admin Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
        }

        res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            admin: newAdmin,
            token
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Admin signup error:", error);
        res.status(500).json({ error: "Failed to create admin account" });
    }
});

admin.get("/otp",async(req,res)=>{
    try {
        // Generate a new OTP
        const otpCode = otp.generate();
          const adminEmail = req.query.email as string;
            
        // Send OTP via email
        await sendEmail({
            to: adminEmail,
            subject: "Your OTP Code",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Your OTP Code</h2>
                    <p>Hello,</p>
                    <p>Your OTP code is:</p>
                    <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
                        <p style="color: #666; margin: 5px 0;">This OTP expires in 5 minutes</p>
                    </div>
                    <p>Please use this code to complete your authentication.</p>
                </div>
            `   
        });
        res.status(200).json({
            success: true,
            message: "OTP sent to your email",
            otp: otpCode // For testing purposes, you might want to remove this in production
        });
    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ error: "Failed to generate OTP" });
        }


})
// ============ ADMIN LOGIN ============
// @ts-ignore
admin.post("/login", async (req, res) => {
    try {
        const validatedData = adminLoginSchema.parse(req.body);
        const { email, password, otp: providedOTP } = validatedData;

        // Find admin user
        const user = await prisma.admin.findUnique({
            where: { email }
        });

        if (!user || user.type !== "ADMIN") {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        if (!user.is_active) {
            return res.status(401).json({ error: "Admin account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        // Check if OTP is required
        const requireOTP = process.env.ADMIN_REQUIRE_OTP === "true";

        if (requireOTP) {
            if (!providedOTP) {
                // Generate and send OTP
                const otpCode = otp.generate();
                
                try {
                    await sendEmail({
                        to: email,
                        subject: "Admin Login - OTP Verification",
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #333;">Admin Login Verification</h2>
                                <p>Hello ${user.first_name},</p>
                                <p>Someone is trying to log into your admin account. If this is you, use the OTP below:</p>
                                <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
                                    <p style="color: #666; margin: 5px 0;">This OTP expires in 5 minutes</p>
                                </div>
                                <p>If this wasn't you, please secure your account immediately.</p>
                                <p>Login attempt from IP: ${req.ip}</p>
                                <p>Time: ${new Date().toLocaleString()}</p>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error("Failed to send OTP email:", emailError);
                    return res.status(500).json({ error: "Failed to send OTP" });
                }

                return res.status(200).json({
                    success: true,
                    message: "OTP sent to your email",
                    requireOTP: true
                });
            }

            // Verify OTP
            const isOTPValid = otp.validate({ token: providedOTP, window: 1 });
            if (!isOTPValid) {
                return res.status(401).json({ error: "Invalid or expired OTP" });
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.type || "ADMIN" 
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Update last login
        await prisma.admin.update({
            where: { email: user.email },
            data: { 
                updated_at: new Date()
            }
        });

        res.json({
            success: true,
            message: "Admin login successful",
            admin: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.type,
                last_login: new Date()
            },
            token
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ============ CHANGE PASSWORD ============
// @ts-ignore
admin.put("/change-password", authAdminMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminEmail = (req as any).user.email;
        
        console.log("Admin Email:", adminEmail);
        console.log("Request body:", req.body);

        // Get current admin data
        const admin = await prisma.admin.findUnique({
            where: { email: adminEmail },
        });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Check if new password is different
        const isSamePassword = await bcrypt.compare(newPassword, admin.password);
        if (isSamePassword) {
            return res.status(400).json({ error: "New password must be different from current password" });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.admin.update({
            where: { email: admin.email },
            data: { 
                password: hashedNewPassword,
                updated_at: new Date()
            }
        });

        // Send notification email
        try {
            await sendEmail({
                to: admin.email,
                subject: "Admin Password Changed Successfully",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Changed Successfully</h2>
                        <p>Hello ${admin.first_name},</p>
                        <p>Your admin account password has been successfully changed.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Account:</strong> ${admin.email}</p>
                            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>If you didn't make this change, please contact the system administrator immediately.</p>
                        <p>Best regards,<br>E-Commerce Security Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send password change notification:", emailError);
        }

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
});

// ============ GET ADMIN PROFILE ============
// @ts-ignore
admin.get("/profile", authAdminMiddleware, async (req, res) => {
    try {
        const adminId = (req as any).user.id;

        const admin = await prisma.admin.findUnique({
            where: { email: (req as any).user.email },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                type: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            }
        });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        res.json({
            success: true,
            admin
        });

    } catch (error) {
        console.error("Get admin profile error:", error);
        res.status(500).json({ error: "Failed to get admin profile" });
    }
});

// ============ LOGOUT ============
// @ts-ignore
admin.post("/logout", authAdminMiddleware, async(req, res) => {
    try {
        // Invalidate the token by not returning it or by using a blacklist strategy
        // Here we simply respond with a success message
        await sendEmail({
            to: (req as any).user.email,
            subject: "Admin Logout Notification",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Logout Successful</h2>
                    <p>Hello ${(req as any).user.first_name},</p>
                    <p>You have successfully logged out of the Admin Panel.</p>
                    <p>If this wasn't you, please contact support immediately.</p>
                    <p>Best regards,<br>E-Commerce Admin Team</p>
                </div>
            `
        });
        res.json({
            success: true,
            message: "Logged out successfully"
            
        });
    } catch (error) {
        console.error("Admin logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
});

// ============ CHANGE EMAIL ============
// @ts-ignore
admin.put("/change-email", authAdminMiddleware, async (req, res) => {
    const { newEmail, password, otp: providedOTP } = req.body;
    try {
        const validatedData = changeEmailSchema.parse({ newEmail, password, otp: providedOTP });
        const adminEmail = (req as any).user.email;

        // Get current admin data
        const admin = await prisma.admin.findUnique({
            where: { email: adminEmail },
        });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Check if OTP is required
        const requireOTP = process.env.ADMIN_REQUIRE_OTP === "true";

        if (requireOTP) {
            if (!providedOTP) {
                // Generate and send OTP
                const otpCode = otp.generate();
                
                try {
                    await sendEmail({
                        to: admin.email,
                        subject: "Admin Email Change - OTP Verification",
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #333;">Email Change Verification</h2>
                                <p>Hello ${admin.first_name},</p>
                                <p>To change your email address, please use the following OTP:</p>
                                <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
                                    <p style="color: #666; margin: 5px 0;">This OTP expires in 5 minutes</p>
                                </div>
                                <p>If this wasn't you, please ignore this email.</p>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error("Failed to send OTP email:", emailError);
                    return res.status(500).json({ error: "Failed to send OTP" });
                }

                return res.status(200).json({
                    success: true,
                    message: "OTP sent to your email",
                    requireOTP: true
                });
            }

            // Verify OTP
            const isOTPValid = otp.validate({ token: providedOTP, window: 1 });
            if (!isOTPValid) {
                return res.status(401).json({ error: "Invalid or expired OTP" });
            }
        }
        // Check if new email is already in use
        const existingEmail = await prisma.admin.findUnique({
            where: { email: validatedData.newEmail }
        });
        if (existingEmail) {
            return res.status(400).json({ error: "Email already in use" });
        }
        // Update email
        const updatedAdmin = await prisma.admin.update({
            where: { email: admin.email },
            data: {
                email: validatedData.newEmail,
                updated_at: new Date()
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                type: true,
                is_active: true,
                created_at: true,
                updated_at: true
            }
        });
        // Send notification email
        try {
            await sendEmail({
                to: updatedAdmin.email,
                subject: "Admin Email Changed Successfully",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Changed Successfully</h2>
                        <p>Hello ${updatedAdmin.first_name},</p>
                        <p>Your admin account email has been successfully changed.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>New Email:</strong> ${updatedAdmin.email}</p>
                            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>If you didn't make this change, please contact the system administrator immediately.</p>
                        <p>Best regards,<br>E-Commerce Security Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send email change notification:", emailError);
            return res.status(500).json({ error: "Failed to send email change notification" });
        }

        res.json({
            success: true,
            message: "Email changed successfully",
            admin: updatedAdmin
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Change email error:", error);
        res.status(500).json({ error: "Failed to change email" });
    }
});


export default admin;