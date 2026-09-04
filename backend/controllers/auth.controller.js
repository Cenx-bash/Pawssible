// ========================================
// ENVIRONMENT VARIABLES
// ========================================

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

// ========================================
// IMPORTS
// ========================================

const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    sendOTPEmail,
    sendPasswordResetOTP
} = require("../utils/email");

// ========================================
// CONFIGURATION
// ========================================

const COMMUNITY_MEMBER_ROLE_ID = 1;

const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const RESET_TOKEN_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

const MAX_OTP_ATTEMPTS = 5;

const BCRYPT_SALT_ROUNDS = 10;

// Temporary registration storage.
//
// NOTE:
// Registration OTPs are kept in memory because the user account
// does not exist yet and email_verifications.user_id is NOT NULL.
//
// If the server restarts, pending registrations are lost.
const pendingRegistrations = new Map();

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Generate a secure 6-digit OTP.
 */
function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generate a secure reset token.
 */
function generateResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Normalize email.
 */
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

/**
 * Validate email.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password.
 *
 * Minimum:
 * - 8 characters
 */
function isValidPassword(password) {
    return typeof password === "string" && password.length >= 8;
}

/**
 * Generate JWT.
 */
function generateToken(user) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            user_id: user.user_id,
            role_id: user.role_id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
}

/**
 * Safely return user information.
 */
function sanitizeUser(user) {
    return {
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: user.role_name || null,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number || null,
        status: user.status,
        email_verified: Boolean(user.email_verified),
        created_at: user.created_at
    };
}

/**
 * Delete expired pending registrations.
 */
function cleanupPendingRegistrations() {
    const now = Date.now();

    for (const [email, registration] of pendingRegistrations.entries()) {
        if (registration.otpExpiresAt <= now) {
            pendingRegistrations.delete(email);
        }
    }
}

/**
 * Create a default user preferences record.
 */
async function createUserPreferences(userId, connection = pool) {
    await connection.execute(
        `
        INSERT INTO user_preferences (
            user_id,
            email_notifications,
            adoption_notifications,
            assistance_notifications
        )
        VALUES (?, TRUE, TRUE, TRUE)
        `,
        [userId]
    );
}

// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {
    try {
        cleanupPendingRegistrations();

        let {
            first_name,
            last_name,
            email,
            password,
            confirm_password,
            phone_number
        } = req.body;

        // ----------------------------------------
        // Normalize input
        // ----------------------------------------

        first_name = first_name?.trim();
        last_name = last_name?.trim();
        email = email ? normalizeEmail(email) : "";
        phone_number = phone_number?.trim() || null;

        // ----------------------------------------
        // Validate required fields
        // ----------------------------------------

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, email, and password are required."
            });
        }

        // ----------------------------------------
        // Validate email
        // ----------------------------------------

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // ----------------------------------------
        // Validate password
        // ----------------------------------------

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        // ----------------------------------------
        // Confirm password
        // ----------------------------------------

        if (confirm_password !== undefined && password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // ----------------------------------------
        // Check if email already exists
        // ----------------------------------------

        const [existingUsers] = await pool.execute(
            `
            SELECT
                user_id,
                email,
                status,
                email_verified
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];

            if (existingUser.email_verified) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists."
                });
            }

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists but has not been verified."
            });
        }

        // ----------------------------------------
        // Hash password
        // ----------------------------------------

        const passwordHash = await bcrypt.hash(
            password,
            BCRYPT_SALT_ROUNDS
        );

        // ----------------------------------------
        // Generate OTP
        // ----------------------------------------

        const otp = generateOTP();

        const otpExpiresAt = Date.now() + OTP_EXPIRATION_MS;

        // ----------------------------------------
        // Store registration temporarily
        // ----------------------------------------

        pendingRegistrations.set(email, {
            firstName: first_name,
            lastName: last_name,
            email,
            phoneNumber: phone_number,
            passwordHash,
            otp,
            otpExpiresAt,
            attempts: 0
        });

        // ----------------------------------------
        // Send OTP email
        // ----------------------------------------

        try {
            await sendOTPEmail(
                email,
                otp,
                first_name
            );
        } catch (emailError) {
            console.error(
                "Registration OTP email error:",
                emailError
            );

            pendingRegistrations.delete(email);

            return res.status(500).json({
                success: false,
                message: "Unable to send verification email. Please try again."
            });
        }

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email for the verification OTP.",
            email
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration."
        });
    }
};

// ========================================
// VERIFY REGISTRATION OTP
// ========================================

const verifyOTP = async (req, res) => {
    let connection;

    try {
        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        const otp = req.body.otp?.toString().trim();

        // ----------------------------------------
        // Validate input
        // ----------------------------------------

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        // ----------------------------------------
        // Get pending registration
        // ----------------------------------------

        const registration = pendingRegistrations.get(email);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration session not found or has expired. Please register again."
            });
        }

        // ----------------------------------------
        // Check expiration
        // ----------------------------------------

        if (Date.now() > registration.otpExpiresAt) {
            pendingRegistrations.delete(email);

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please register again."
            });
        }

        // ----------------------------------------
        // Check attempts
        // ----------------------------------------

        if (registration.attempts >= MAX_OTP_ATTEMPTS) {
            pendingRegistrations.delete(email);

            return res.status(429).json({
                success: false,
                message: "Too many incorrect OTP attempts. Please register again."
            });
        }

        // ----------------------------------------
        // Verify OTP
        // ----------------------------------------

        if (otp !== registration.otp) {
            registration.attempts += 1;

            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${MAX_OTP_ATTEMPTS - registration.attempts} attempt(s) remaining.`
            });
        }

        // ----------------------------------------
        // Begin transaction
        // ----------------------------------------

        connection = await pool.getConnection();

        await connection.beginTransaction();

        // ----------------------------------------
        // Double-check email
        // ----------------------------------------

        const [existingUsers] = await connection.execute(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();

            pendingRegistrations.delete(email);

            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        // ----------------------------------------
        // Create user
        // ----------------------------------------

        const [result] = await connection.execute(
            `
            INSERT INTO users (
                role_id,
                first_name,
                last_name,
                email,
                password_hash,
                phone_number,
                status,
                email_verified
            )
            VALUES (?, ?, ?, ?, ?, ?, 'active', TRUE)
            `,
            [
                COMMUNITY_MEMBER_ROLE_ID,
                registration.firstName,
                registration.lastName,
                registration.email,
                registration.passwordHash,
                registration.phoneNumber
            ]
        );

        const userId = result.insertId;

        // ----------------------------------------
        // Create user preferences
        // ----------------------------------------

        await createUserPreferences(
            userId,
            connection
        );

        // ----------------------------------------
        // Record successful verification
        //
        // We create the email_verifications record
        // after the user exists because user_id is NOT NULL.
        // ----------------------------------------

        const otpHash = await bcrypt.hash(
            registration.otp,
            BCRYPT_SALT_ROUNDS
        );

        await connection.execute(
            `
            INSERT INTO email_verifications (
                user_id,
                otp_hash,
                expires_at,
                verified_at,
                attempts
            )
            VALUES (?, ?, NOW(), NOW(), ?)
            `,
            [
                userId,
                otpHash,
                registration.attempts
            ]
        );

        // ----------------------------------------
        // Commit
        // ----------------------------------------

        await connection.commit();

        // ----------------------------------------
        // Remove pending registration
        // ----------------------------------------

        pendingRegistrations.delete(email);

        // ----------------------------------------
        // Get created user
        // ----------------------------------------

        const [users] = await pool.execute(
            `
            SELECT
                u.user_id,
                u.role_id,
                r.role_name,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.status,
                u.email_verified,
                u.created_at
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.user_id = ?
            LIMIT 1
            `,
            [userId]
        );

        const user = users[0];

        // ----------------------------------------
        // Generate JWT
        // ----------------------------------------

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. Your account has been created.",
            token,
            user: sanitizeUser(user)
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while verifying OTP."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ========================================
// RESEND REGISTRATION OTP
// ========================================

const resendOTP = async (req, res) => {
    try {
        cleanupPendingRegistrations();

        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        // ----------------------------------------
        // Validate email
        // ----------------------------------------

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // ----------------------------------------
        // Find registration
        // ----------------------------------------

        const registration = pendingRegistrations.get(email);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration session not found or has expired. Please register again."
            });
        }

        // ----------------------------------------
        // Generate new OTP
        // ----------------------------------------

        const otp = generateOTP();

        registration.otp = otp;
        registration.otpExpiresAt =
            Date.now() + OTP_EXPIRATION_MS;

        registration.attempts = 0;

        pendingRegistrations.set(
            email,
            registration
        );

        // ----------------------------------------
        // Send new OTP
        // ----------------------------------------

        try {
            await sendOTPEmail(
                email,
                otp,
                registration.firstName
            );
        } catch (emailError) {
            console.error(
                "RESEND OTP EMAIL ERROR:",
                emailError
            );

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP email. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new verification OTP has been sent.",
            email
        });

    } catch (error) {
        console.error("RESEND OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while resending OTP."
        });
    }
};

// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
    try {
        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        const password = req.body.password;

        // ----------------------------------------
        // Validate input
        // ----------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // ----------------------------------------
        // Find user
        // ----------------------------------------

        const [users] = await pool.execute(
            `
            SELECT
                u.user_id,
                u.role_id,
                r.role_name,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                u.password_hash,
                u.status,
                u.email_verified,
                u.created_at
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.email = ?
            LIMIT 1
            `,
            [email]
        );

        // ----------------------------------------
        // User not found
        // ----------------------------------------

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        // ----------------------------------------
        // Verify password
        // ----------------------------------------

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ----------------------------------------
        // Check email verification
        // ----------------------------------------

        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
                email_verified: false
            });
        }

        // ----------------------------------------
        // Check account status
        // ----------------------------------------

        if (user.status !== "active") {
            let message = "Your account is not active.";

            if (user.status === "suspended") {
                message = "Your account has been suspended.";
            } else if (user.status === "inactive") {
                message = "Your account is inactive.";
            } else if (user.status === "pending") {
                message = "Your account is still pending.";
            }

            return res.status(403).json({
                success: false,
                message
            });
        }

        // ----------------------------------------
        // Update last login
        // ----------------------------------------

        await pool.execute(
            `
            UPDATE users
            SET last_login_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [user.user_id]
        );

        // ----------------------------------------
        // Generate JWT
        // ----------------------------------------

        const token = generateToken(user);

        // ----------------------------------------
        // Remove password hash
        // ----------------------------------------

        const safeUser = sanitizeUser(user);

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
};

// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        // ----------------------------------------
        // Validate email
        // ----------------------------------------

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // ----------------------------------------
        // Find user
        // ----------------------------------------

        const [users] = await pool.execute(
            `
            SELECT
                user_id,
                first_name,
                email,
                status
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        // ----------------------------------------
        // Don't reveal whether account exists
        // ----------------------------------------

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset OTP has been sent."
            });
        }

        const user = users[0];

        // ----------------------------------------
        // Generate OTP
        // ----------------------------------------

        const otp = generateOTP();

        const otpHash = await bcrypt.hash(
            otp,
            BCRYPT_SALT_ROUNDS
        );

        // ----------------------------------------
        // Expiration
        // ----------------------------------------

        const expiresAt = new Date(
            Date.now() + OTP_EXPIRATION_MS
        );

        // ----------------------------------------
        // Invalidate previous reset requests
        // ----------------------------------------

        await pool.execute(
            `
            UPDATE password_resets
            SET used_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
              AND used_at IS NULL
            `,
            [user.user_id]
        );

        // ----------------------------------------
        // Create new password reset record
        // ----------------------------------------

        await pool.execute(
            `
            INSERT INTO password_resets (
                user_id,
                otp_hash,
                expires_at,
                attempts
            )
            VALUES (?, ?, ?, 0)
            `,
            [
                user.user_id,
                otpHash,
                expiresAt
            ]
        );

        // ----------------------------------------
        // Send OTP
        // ----------------------------------------

        try {
            await sendPasswordResetOTP(
                email,
                otp,
                user.first_name
            );
        } catch (emailError) {
            console.error(
                "PASSWORD RESET EMAIL ERROR:",
                emailError
            );

            // Remove the reset request if email failed
            await pool.execute(
                `
                DELETE FROM password_resets
                WHERE user_id = ?
                  AND used_at IS NULL
                  AND otp_hash = ?
                `,
                [
                    user.user_id,
                    otpHash
                ]
            );

            return res.status(500).json({
                success: false,
                message: "Unable to send password reset email. Please try again."
            });
        }

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            message: "If an account with that email exists, a password reset OTP has been sent.",
            email
        });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while processing password reset."
        });
    }
};

// ========================================
// VERIFY RESET OTP
// ========================================

const verifyResetOTP = async (req, res) => {
    try {
        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        const otp = req.body.otp?.toString().trim();

        // ----------------------------------------
        // Validate input
        // ----------------------------------------

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required."
            });
        }

        // ----------------------------------------
        // Find latest reset request
        // ----------------------------------------

        const [resets] = await pool.execute(
            `
            SELECT
                pr.reset_id,
                pr.user_id,
                pr.otp_hash,
                pr.expires_at,
                pr.verified_at,
                pr.used_at,
                pr.attempts,
                u.email,
                u.first_name
            FROM password_resets pr
            INNER JOIN users u
                ON pr.user_id = u.user_id
            WHERE u.email = ?
              AND pr.used_at IS NULL
            ORDER BY pr.created_at DESC
            LIMIT 1
            `,
            [email]
        );

        // ----------------------------------------
        // No reset request
        // ----------------------------------------

        if (resets.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active password reset request found."
            });
        }

        const reset = resets[0];

        // ----------------------------------------
        // Check expiration
        // ----------------------------------------

        if (new Date(reset.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new password reset OTP."
            });
        }

        // ----------------------------------------
        // Check attempts
        // ----------------------------------------

        if (reset.attempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect OTP attempts. Please request a new OTP."
            });
        }

        // ----------------------------------------
        // Check OTP
        // ----------------------------------------

        const otpMatch = await bcrypt.compare(
            otp,
            reset.otp_hash
        );

        if (!otpMatch) {
            await pool.execute(
                `
                UPDATE password_resets
                SET attempts = attempts + 1
                WHERE reset_id = ?
                `,
                [reset.reset_id]
            );

            const remainingAttempts =
                MAX_OTP_ATTEMPTS - reset.attempts - 1;

            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${Math.max(remainingAttempts, 0)} attempt(s) remaining.`
            });
        }

        // ----------------------------------------
        // Generate secure reset token
        // ----------------------------------------

        const resetToken = generateResetToken();

        const resetTokenHash = await bcrypt.hash(
            resetToken,
            BCRYPT_SALT_ROUNDS
        );

        const resetTokenExpiresAt = new Date(
            Date.now() + RESET_TOKEN_EXPIRATION_MS
        );

        // ----------------------------------------
        // Mark OTP verified
        // ----------------------------------------

        await pool.execute(
            `
            UPDATE password_resets
            SET
                verified_at = CURRENT_TIMESTAMP,
                reset_token_hash = ?,
                reset_token_expires_at = ?
            WHERE reset_id = ?
            `,
            [
                resetTokenHash,
                resetTokenExpiresAt,
                reset.reset_id
            ]
        );

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            reset_token: resetToken
        });

    } catch (error) {
        console.error(
            "VERIFY RESET OTP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while verifying reset OTP."
        });
    }
};

// ========================================
// RESET PASSWORD
// ========================================

const resetPassword = async (req, res) => {
    let connection;

    try {
        const email = req.body.email
            ? normalizeEmail(req.body.email)
            : "";

        const resetToken =
            req.body.reset_token?.toString().trim();

        const newPassword =
            req.body.new_password ||
            req.body.password;

        const confirmPassword =
            req.body.confirm_password;

        // ----------------------------------------
        // Validate input
        // ----------------------------------------

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, reset token, and new password are required."
            });
        }

        // ----------------------------------------
        // Validate password
        // ----------------------------------------

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        // ----------------------------------------
        // Confirm password
        // ----------------------------------------

        if (
            confirmPassword !== undefined &&
            newPassword !== confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // ----------------------------------------
        // Find verified reset request
        // ----------------------------------------

        const [resets] = await pool.execute(
            `
            SELECT
                pr.reset_id,
                pr.user_id,
                pr.reset_token_hash,
                pr.reset_token_expires_at,
                pr.verified_at,
                pr.used_at,
                u.email
            FROM password_resets pr
            INNER JOIN users u
                ON pr.user_id = u.user_id
            WHERE u.email = ?
              AND pr.verified_at IS NOT NULL
              AND pr.used_at IS NULL
            ORDER BY pr.created_at DESC
            LIMIT 1
            `,
            [email]
        );

        // ----------------------------------------
        // No reset request
        // ----------------------------------------

        if (resets.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid password reset session found. Please start again."
            });
        }

        const reset = resets[0];

        // ----------------------------------------
        // Check token exists
        // ----------------------------------------

        if (!reset.reset_token_hash) {
            return res.status(400).json({
                success: false,
                message: "Invalid password reset session."
            });
        }

        // ----------------------------------------
        // Check token expiration
        // ----------------------------------------

        if (
            !reset.reset_token_expires_at ||
            new Date(reset.reset_token_expires_at) < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset token has expired. Please request a new password reset."
            });
        }

        // ----------------------------------------
        // Verify reset token
        // ----------------------------------------

        const tokenMatch = await bcrypt.compare(
            resetToken,
            reset.reset_token_hash
        );

        if (!tokenMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid reset token."
            });
        }

        // ----------------------------------------
        // Hash new password
        // ----------------------------------------

        const newPasswordHash = await bcrypt.hash(
            newPassword,
            BCRYPT_SALT_ROUNDS
        );

        // ----------------------------------------
        // Begin transaction
        // ----------------------------------------

        connection = await pool.getConnection();

        await connection.beginTransaction();

        // ----------------------------------------
        // Update password
        // ----------------------------------------

        await connection.execute(
            `
            UPDATE users
            SET
                password_hash = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            `,
            [
                newPasswordHash,
                reset.user_id
            ]
        );

        // ----------------------------------------
        // Mark reset as used
        // ----------------------------------------

        await connection.execute(
            `
            UPDATE password_resets
            SET
                used_at = CURRENT_TIMESTAMP,
                reset_token_hash = NULL,
                reset_token_expires_at = NULL
            WHERE reset_id = ?
            `,
            [reset.reset_id]
        );

        // ----------------------------------------
        // Commit
        // ----------------------------------------

        await connection.commit();

        // ----------------------------------------
        // Response
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password."
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );
            }
        }

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while resetting password."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};