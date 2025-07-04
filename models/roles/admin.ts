import express from "express";
import { PrismaClient } from "../../db/generated/prisma";
import z from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as OTPAuth from "otpauth";
// import { sendEmail } from "nodemailer";
import nodemailer from "nodemailer";

// Utility function to send email using nodemailer

import { logout } from "../settings_management_api";

const admin = express.Router();
const prisma = new PrismaClient();

admin.use(express.json());
export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.example.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || "user@example.com",
            pass: process.env.SMTP_PASS || "password"
        }
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM || '"E-Commerce Admin" <admin@example.com>',
        to,
        subject,
        html
    });
}
// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// OTP Configuration
const otp = new OTPAuth.TOTP({
    issuer: "E-Commerce Admin",
    label: "Admin Panel",
    algorithm: "SHA1",
    digits: 6,
    period: 300, // 5 minutes
    secret: "ADMIN_SECRET_KEY_2024"
});

// Validation Schemas
const adminSignupSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    adminKey: z.string().min(1, "Admin key is required"), // Special key for admin registration
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

const requestOTPSchema = z.object({
    email: z.string().email("Invalid email format"),
    type: z.enum(["email_change", "password_reset", "login"])
});

// Middleware for admin authentication
const authAdminMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        const admin = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                type: true,
                
            }
        });

        if (!admin || admin.type !== "admin" ) {
            return res.status(403).json({ error: "Admin access required" });
        }

        req.userId = admin;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

// ============ ADMIN SIGNUP ============
admin.post("/signup", async (req, res) => {
    try {
        const validatedData = adminSignupSchema.parse(req.body);
        const { email, password,  name } = validatedData;

       

        // Check if admin already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
                
            },
            select: {
                id: true,
                email: true,
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newAdmin.id, 
                email: newAdmin.email, 
                role: newAdmin.type 
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
                        <p>Hello ${name},</p>
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

// ============ ADMIN LOGIN ============
admin.post("/login", async (req, res) => {
    try {
        const validatedData = adminLoginSchema.parse(req.body);
        const { email, password, otp: providedOTP } = validatedData;

        // Find admin user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.type !== "admin") {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        if (!user) {
            return res.status(401).json({ error: "Admin account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        // Check if OTP is required (for enhanced security)
        const requireOTP = process.env.ADMIN_REQUIRE_OTP === "true" || true; // Default to true for admin

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
                                <p>Hello ${user.name},</p>
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
                role: user.type 
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

    

        // Log admin login
        console.log(`Admin login: ${email} at ${new Date().toISOString()} from IP: ${req.ip}`);

        res.json({
            success: true,
            message: "Admin login successful",
            admin: {
                id: user.id,
                email: user.email,
                first_name: user.name,
                
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
admin.put("/change-password", authAdminMiddleware, async (req, res) => {
    try {
        const validatedData = changePasswordSchema.parse(req.body);
        const { currentPassword, newPassword } = validatedData;
        const adminId = req.userId;

        // Get current admin data
        const admin = await prisma.user.findUnique({
            where: { id: adminId }
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
        await prisma.user.update({
            where: { id: adminId },
            data: { 
                password: hashedNewPassword,
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
                        <p>Hello ${admin.name},</p>
                        <p>Your admin account password has been successfully changed.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Account:</strong> ${admin.email}</p>
                            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>IP Address:</strong> ${req.ip}</p>
                        </div>
                        <p>If you didn't make this change, please contact the system administrator immediately.</p>
                        <p>Best regards,<br>E-Commerce Security Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send password change notification:", emailError);
        }

        // Log password change
        console.log(`Admin password changed: ${admin.email} at ${new Date().toISOString()} from IP: ${req.ip}`);

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

// ============ REQUEST OTP FOR EMAIL CHANGE ============
admin.post("/request-email-change-otp", authAdminMiddleware, async (req, res) => {
    try {
        const { newEmail } = z.object({
            newEmail: z.string().email("Invalid email format")
        }).parse(req.body);

        const adminId = req.userId;

        // Check if new email is already in use
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        // Generate OTP
        const otpCode = otp.generate();

        // Send OTP to new email
        try {
            await sendEmail({
                to: newEmail,
                subject: "Admin Email Change - Verification Required",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Change Verification</h2>
                        <p>Hello,</p>
                        <p>You are requesting to change your admin account email to this address.</p>
                        <p>Please use the OTP below to verify this email address:</p>
                        <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
                            <p style="color: #666; margin: 5px 0;">This OTP expires in 5 minutes</p>
                        </div>
                        <p>If you didn't request this change, please ignore this email.</p>
                        <p>Current admin account: ${existingUser}</p>
                        <p>Requested at: ${new Date().toLocaleString()}</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send email change OTP:", emailError);
            return res.status(500).json({ error: "Failed to send verification email" });
        }

        res.json({
            success: true,
            message: "Verification OTP sent to new email address"
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Request email change OTP error:", error);
        res.status(500).json({ error: "Failed to send verification OTP" });
    }
});

// ============ CHANGE EMAIL ============
admin.put("/change-email", authAdminMiddleware, async (req, res) => {
    try {
        const validatedData = changeEmailSchema.parse(req.body);
        const { newEmail, password, otp: providedOTP } = validatedData;
        const adminId = req.userId;

        // Get current admin data
        const admin = await prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Password is incorrect" });
        }

        // Verify OTP
        const isOTPValid = otp.validate({ token: providedOTP, window: 1 });
        if (!isOTPValid) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Check if new email is already in use
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail }
        });

        if (existingUser && existingUser.id !== adminId) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        // Update email
        const updatedAdmin = await prisma.user.update({
            where: { id: adminId },
            data: { 
                email: newEmail,
            },
            select: {
                id: true,
                email: true,
                name: true,
               
            }
        });

        // Send confirmation emails
        try {
            // Email to old address
            await sendEmail({
                to: admin.email,
                subject: "Admin Email Address Changed",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Address Changed</h2>
                        <p>Hello ${admin.name},</p>
                        <p>Your admin account email has been changed from this address.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Old Email:</strong> ${admin.email}</p>
                            <p><strong>New Email:</strong> ${newEmail}</p>
                            <p><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>If you didn't make this change, please contact the system administrator immediately.</p>
                    </div>
                `
            });

            // Email to new address
            await sendEmail({
                to: newEmail,
                subject: "Admin Email Address Updated Successfully",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Email Address Updated</h2>
                        <p>Hello ${admin.name},</p>
                        <p>Your admin account email has been successfully updated to this address.</p>
                        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <p><strong>Account:</strong> ${newEmail}</p>
                            <p><strong>Role:</strong> Administrator</p>
                            <p><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>You can now use this email address to log into your admin account.</p>
                        <p>Best regards,<br>E-Commerce Admin Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send email change notifications:", emailError);
        }

        // Log email change
        console.log(`Admin email changed: ${admin.email} -> ${newEmail} at ${new Date().toISOString()} from IP: ${req.ip}`);

        res.json({
            success: true,
            message: "Email address changed successfully",
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
        res.status(500).json({ error: "Failed to change email address" });
    }
});

// ============ GET ADMIN PROFILE ============
admin.get("/profile", authAdminMiddleware, async (req, res) => {
    try {
        const adminId = req.userId;

        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                name: true,
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

// ============ UPDATE ADMIN PROFILE ============
admin.put("/profile", authAdminMiddleware, async (req, res) => {
    try {
        const updateSchema = z.object({
            firstName: z.string().min(2).optional(),
            lastName: z.string().min(2).optional(),
            phone: z.string().min(10).optional()
        });

        const validatedData = updateSchema.parse(req.body);
        const adminId = req.user.id;

        const updatedAdmin = await prisma.user.update({
            where: { id: adminId },
            data: {
                name: validatedData.firstName,
            },
            select: {
                id: true,
                email: true,
                name: true,
                            }
        });

        res.json({
            success: true,
            message: "Profile updated successfully",
            admin: updatedAdmin
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Update admin profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ============ LOGOUT ============
admin.post("/logout", authAdminMiddleware, async (req, res) => {
    try {
        // In a real application, you might want to blacklist the token
        // or store it in a blacklist table/cache
        
        // Log admin logout
        console.log(`Admin logout: ${req.userId} at ${new Date().toISOString()} from IP: ${req.ip}`);

        res.json({
            success: true,
            message: "Logged out successfully",
            logout:req.ip
                
        });

    } catch (error) {
        console.error("Admin logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
});

// ============ REQUEST PASSWORD RESET ============
admin.post("/request-password-reset", async (req, res) => {
    try {
        const { email } = z.object({
            email: z.string().email("Invalid email format")
        }).parse(req.body);

        const admin = await prisma.user.findUnique({
            where: { email }
        });

        if (!admin || admin.type !== "admin") {
            // Don't reveal if admin exists or not for security
            return res.json({
                success: true,
                message: "If an admin account exists with this email, a reset link has been sent"
            });
        }

        // Generate OTP for password reset
        const otpCode = otp.generate();

        try {
            await sendEmail({
                to: email,
                subject: "Admin Password Reset Request",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p>Hello ${admin.name},</p>
                        <p>You requested a password reset for your admin account.</p>
                        <p>Use the OTP below to reset your password:</p>
                        <div style="background: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otpCode}</h1>
                            <p style="color: #666; margin: 5px 0;">This OTP expires in 5 minutes</p>
                        </div>
                        <p>If you didn't request this reset, please ignore this email and secure your account.</p>
                        <p>Request made at: ${new Date().toLocaleString()}</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            return res.status(500).json({ error: "Failed to send password reset email" });
        }

        res.json({
            success: true,
            message: "If an admin account exists with this email, a reset OTP has been sent"
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Request password reset error:", error);
        res.status(500).json({ error: "Failed to process password reset request" });
    }
});

// ============ RESET PASSWORD ============
admin.post("/reset-password", async (req, res) => {
    try {
        const resetSchema = z.object({
            email: z.string().email("Invalid email format"),
            otp: z.string().min(6, "OTP is required"),
            newPassword: z.string().min(8, "Password must be at least 8 characters"),
            confirmPassword: z.string().min(1, "Password confirmation is required")
        }).refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords don't match",
            path: ["confirmPassword"],
        });

        const validatedData = resetSchema.parse(req.body);
        const { email, otp: providedOTP, newPassword } = validatedData;

        // Find admin
        const admin = await prisma.user.findUnique({
            where: { email }
        });

        if (!admin || admin.type !== "admin") {
             res.status(400).json({ error: "Invalid reset request" });
        }

        // Verify OTP
        const isOTPValid = otp.validate({ token: providedOTP, window: 1 });
        if (!isOTPValid) {
             res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
         
        await prisma.user.update({
            where: { id: admin?.id },
            data: { 
                password: hashedPassword,
            }
        });

        // Send confirmation email
        try {
            await sendEmail({
                to: email,
                subject: "Admin Password Reset Successfully",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset Successful</h2>
                        <p>Hello ${admin.name},</p>
                        <p>Your admin account password has been successfully reset.</p>
                        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <p><strong>Account:</strong> ${email}</p>
                            <p><strong>Reset at:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>You can now log in with your new password.</p>
                        <p>If you didn't request this reset, please contact the system administrator immediately.</p>
                        <p>Best regards,<br>E-Commerce Security Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send password reset confirmation:", emailError);
        }

        // Log password reset
        console.log(`Admin password reset: ${email} at ${new Date().toISOString()} from IP: ${req.ip}`);

        res.json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: "Validation failed", 
                details: error.errors 
            });
        }
        
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
});

export default admin;