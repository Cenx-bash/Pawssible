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
} = require("../services/email.service");

// ========================================
// PENDING REGISTRATIONS
// ========================================

const pendingRegistrations = new Map();

const OTP_EXPIRATION_MS = 5 * 60 * 1000;

// ========================================
// VALIDATION
// ========================================

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
    return (
        typeof email === "string" &&
        EMAIL_REGEX.test(email.trim())
    );
}

function getPasswordError(password) {

    if (
        typeof password !== "string" ||
        password.length < 8
    ) {
        return "Password must be at least 8 characters long";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
}

// ========================================
// GENERATE OTP
// ========================================

function generateOTP() {

    return crypto
        .randomInt(100000, 1000000)
        .toString();

}

// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {

    try {

        const {
            first_name,
            last_name,
            email,
            password,
            phone
        } = req.body;

        // --------------------------------
        // REQUIRED FIELDS
        // --------------------------------

        if (
            !first_name ||
            !last_name ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "First name, last name, email, and password are required"
            });

        }

        // --------------------------------
        // EMAIL
        // --------------------------------

        if (!isValidEmail(email)) {

            return res.status(400).json({
                message:
                    "Please enter a valid email address"
            });

        }

        // --------------------------------
        // PASSWORD
        // --------------------------------

        const passwordError =
            getPasswordError(password);

        if (passwordError) {

            return res.status(400).json({
                message: passwordError
            });

        }

        // --------------------------------
        // NORMALIZE
        // --------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();

        const firstName =
            first_name.trim();

        const lastName =
            last_name.trim();

        // --------------------------------
        // CHECK DATABASE
        // --------------------------------

        const [existingUsers] =
            await pool.query(
                `
                SELECT user_id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [normalizedEmail]
            );

        if (existingUsers.length > 0) {

            return res.status(409).json({
                message:
                    "Email is already registered"
            });

        }

        // --------------------------------
        // HASH PASSWORD
        // --------------------------------

        const passwordHash =
            await bcrypt.hash(password, 10);

        // --------------------------------
        // GENERATE OTP
        // --------------------------------

        const otp =
            generateOTP();

        const expiresAt =
            Date.now() + OTP_EXPIRATION_MS;

        // --------------------------------
        // STORE PENDING REGISTRATION
        // --------------------------------

        pendingRegistrations.set(
            normalizedEmail,
            {
                first_name: firstName,
                last_name: lastName,
                email: normalizedEmail,
                password_hash: passwordHash,
                phone: phone || null,
                otp,
                expiresAt,
                attempts: 0
            }
        );

        console.log(
            `OTP generated for ${normalizedEmail}: ${otp}`
        );

        // --------------------------------
        // SEND EMAIL
        // --------------------------------

        try {

            await sendOTPEmail(
                normalizedEmail,
                otp,
                firstName
            );

        } catch (emailError) {

            console.error(
                "REGISTRATION OTP EMAIL ERROR:",
                emailError
            );

            pendingRegistrations.delete(
                normalizedEmail
            );

            return res.status(500).json({
                message:
                    "Unable to send verification code. Please try again."
            });

        }

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.status(201).json({

            message:
                "Registration started. Please check your email for the OTP.",

            email:
                normalizedEmail,

            requiresVerification:
                true

        });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Registration failed"
        });

    }

};

// ========================================
// VERIFY REGISTRATION OTP
// ========================================

const verifyOTP = async (req, res) => {

    try {

        const {
            email,
            otp
        } = req.body;

        // --------------------------------
        // VALIDATE
        // --------------------------------

        if (!email || !otp) {

            return res.status(400).json({
                message:
                    "Email and OTP are required"
            });

        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const cleanOTP =
            String(otp).trim();

        // --------------------------------
        // FIND PENDING REGISTRATION
        // --------------------------------

        const pending =
            pendingRegistrations.get(
                normalizedEmail
            );

        if (!pending) {

            return res.status(404).json({
                message:
                    "No pending registration found. Please register again."
            });

        }

        // --------------------------------
        // CHECK EXPIRATION
        // --------------------------------

        if (
            Date.now() >
            pending.expiresAt
        ) {

            pendingRegistrations.delete(
                normalizedEmail
            );

            return res.status(400).json({
                message:
                    "OTP has expired. Please register again."
            });

        }

        // --------------------------------
        // CHECK OTP
        // --------------------------------

        if (cleanOTP !== pending.otp) {

            pending.attempts++;

            if (pending.attempts >= 5) {

                pendingRegistrations.delete(
                    normalizedEmail
                );

                return res.status(429).json({
                    message:
                        "Too many incorrect OTP attempts. Please register again."
                });

            }

            return res.status(400).json({
                message:
                    "Invalid OTP. Please check the code and try again."
            });

        }

        // --------------------------------
        // ROLE
        // --------------------------------

        const PET_OWNER_ROLE_ID = 1;

        // --------------------------------
        // CREATE USER
        // --------------------------------

        const [result] =
            await pool.query(
                `
                INSERT INTO users
                (
                    role_id,
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    phone
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    PET_OWNER_ROLE_ID,
                    pending.first_name,
                    pending.last_name,
                    pending.email,
                    pending.password_hash,
                    pending.phone
                ]
            );

        // --------------------------------
        // REMOVE PENDING REGISTRATION
        // --------------------------------

        pendingRegistrations.delete(
            normalizedEmail
        );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.status(201).json({

            message:
                "Email verified and account created successfully",

            user_id:
                result.insertId

        });

    } catch (error) {

        console.error(
            "VERIFY OTP ERROR:",
            error
        );

        if (
            error.code === "ER_DUP_ENTRY"
        ) {

            pendingRegistrations.delete(
                String(req.body.email || "")
                    .trim()
                    .toLowerCase()
            );

            return res.status(409).json({
                message:
                    "Email is already registered"
            });

        }

        return res.status(500).json({
            message:
                "OTP verification failed"
        });

    }

};

// ========================================
// RESEND REGISTRATION OTP
// ========================================

const resendOTP = async (req, res) => {

    try {

        const {
            email
        } = req.body;

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required"
            });

        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const pending =
            pendingRegistrations.get(
                normalizedEmail
            );

        if (!pending) {

            return res.status(404).json({
                message:
                    "No pending registration found. Please register again."
            });

        }

        // --------------------------------
        // GENERATE NEW OTP
        // --------------------------------

        const newOTP =
            generateOTP();

        pending.otp =
            newOTP;

        pending.expiresAt =
            Date.now() + OTP_EXPIRATION_MS;

        pending.attempts =
            0;

        pendingRegistrations.set(
            normalizedEmail,
            pending
        );

        console.log(
            `New registration OTP generated for ${normalizedEmail}: ${newOTP}`
        );

        // --------------------------------
        // SEND EMAIL
        // --------------------------------

        try {

            await sendOTPEmail(
                normalizedEmail,
                newOTP,
                pending.first_name
            );

        } catch (emailError) {

            console.error(
                "RESEND OTP EMAIL ERROR:",
                emailError
            );

            return res.status(500).json({
                message:
                    "Unable to resend OTP. Please try again."
            });

        }

        return res.json({
            message:
                "A new OTP has been sent to your email."
        });

    } catch (error) {

        console.error(
            "RESEND OTP ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to resend OTP"
        });

    }

};

// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required"
            });

        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // --------------------------------
        // FIND USER
        // --------------------------------

        const [users] =
            await pool.query(
                `
                SELECT
                    user_id,
                    role_id,
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    phone,
                    status
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [normalizedEmail]
            );

        if (users.length === 0) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });

        }

        const user =
            users[0];

        // --------------------------------
        // ACCOUNT STATUS
        // --------------------------------

        if (
            user.status &&
            user.status !== "active"
        ) {

            return res.status(403).json({
                message:
                    `Account is ${user.status}`
            });

        }

        // --------------------------------
        // PASSWORD
        // --------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });

        }

        // --------------------------------
        // JWT
        // --------------------------------

        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is missing from .env"
            );

            return res.status(500).json({
                message:
                    "Server authentication configuration error"
            });

        }

        const token =
            jwt.sign(
                {
                    user_id:
                        user.user_id,

                    role_id:
                        user.role_id,

                    email:
                        user.email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "1d"
                }
            );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.json({

            message:
                "Login successful",

            token,

            user: {

                user_id:
                    user.user_id,

                role_id:
                    user.role_id,

                first_name:
                    user.first_name,

                last_name:
                    user.last_name,

                email:
                    user.email,

                phone:
                    user.phone

            }

        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Login failed"
        });

    }

};

// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPassword = async (req, res) => {

    try {

        const email =
            String(
                req.body.email || ""
            )
                .trim()
                .toLowerCase();

        // --------------------------------
        // VALIDATE EMAIL
        // --------------------------------

        if (!email) {

            return res.status(400).json({
                message:
                    "Email is required."
            });

        }

        if (!isValidEmail(email)) {

            return res.status(400).json({
                message:
                    "Please enter a valid email address."
            });

        }

        // --------------------------------
        // FIND USER
        // --------------------------------

        const [users] =
            await pool.query(
                `
                SELECT
                    user_id,
                    email
                FROM users
                WHERE LOWER(email) = ?
                LIMIT 1
                `,
                [email]
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "No account was found with that email."
            });

        }

        const user =
            users[0];

        // --------------------------------
        // GENERATE OTP
        // --------------------------------

        const otp =
            generateOTP();

        const expiresAt =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        // --------------------------------
        // GENERATE RESET TOKEN
        // --------------------------------

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        const resetTokenExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        // --------------------------------
        // SAVE RESET INFORMATION
        // --------------------------------

        await pool.query(
            `
            UPDATE users
            SET
                reset_otp = ?,
                reset_otp_expires = ?,
                reset_token = ?,
                reset_token_expires = ?
            WHERE user_id = ?
            `,
            [
                otp,
                expiresAt,
                resetToken,
                resetTokenExpires,
                user.user_id
            ]
        );

        console.log(
            `Password reset OTP generated for ${email}: ${otp}`
        );

        // --------------------------------
        // SEND EMAIL
        // --------------------------------

        try {

            await sendPasswordResetOTP(
                email,
                otp
            );

        } catch (emailError) {

            console.error(
                "PASSWORD RESET EMAIL ERROR:",
                emailError
            );

            // Clear reset information
            await pool.query(
                `
                UPDATE users
                SET
                    reset_otp = NULL,
                    reset_otp_expires = NULL,
                    reset_token = NULL,
                    reset_token_expires = NULL
                WHERE user_id = ?
                `,
                [user.user_id]
            );

            return res.status(500).json({
                message:
                    "Unable to send password reset code. Please try again."
            });

        }

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.json({

            success:
                true,

            message:
                "Password reset code sent successfully.",

            email:
                email

        });

    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to send password reset code."
        });

    }

};

// ========================================
// VERIFY RESET OTP
// ========================================

const verifyResetOTP = async (req, res) => {

    try {

        const email =
            String(
                req.body.email || ""
            )
                .trim()
                .toLowerCase();

        const otp =
            String(
                req.body.otp || ""
            )
                .trim();

        // --------------------------------
        // VALIDATE
        // --------------------------------

        if (!email || !otp) {

            return res.status(400).json({
                message:
                    "Email and OTP are required."
            });

        }

        if (!/^\d{6}$/.test(otp)) {

            return res.status(400).json({
                message:
                    "OTP must contain exactly 6 numbers."
            });

        }

        // --------------------------------
        // FIND USER
        // --------------------------------

        const [users] =
            await pool.query(
                `
                SELECT
                    user_id,
                    email,
                    reset_otp,
                    reset_otp_expires
                FROM users
                WHERE LOWER(email) = ?
                LIMIT 1
                `,
                [email]
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "Account not found."
            });

        }

        const user =
            users[0];

        // --------------------------------
        // CHECK OTP
        // --------------------------------

        if (
            !user.reset_otp ||
            String(user.reset_otp) !== otp
        ) {

            return res.status(400).json({
                message:
                    "Invalid reset code."
            });

        }

        // --------------------------------
        // CHECK EXPIRATION
        // --------------------------------

        if (
            !user.reset_otp_expires ||
            new Date(
                user.reset_otp_expires
            ) < new Date()
        ) {

            return res.status(400).json({
                message:
                    "Reset code has expired. Please request a new one."
            });

        }

        // --------------------------------
        // CREATE NEW RESET TOKEN
        // --------------------------------

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        const tokenExpires =
            new Date(
                Date.now() +
                10 * 60 * 1000
            );

        // --------------------------------
        // SAVE RESET TOKEN
        // --------------------------------

        await pool.query(
            `
            UPDATE users
            SET
                reset_token = ?,
                reset_token_expires = ?,
                reset_otp = NULL,
                reset_otp_expires = NULL
            WHERE user_id = ?
            `,
            [
                resetToken,
                tokenExpires,
                user.user_id
            ]
        );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.json({

            success:
                true,

            message:
                "Reset code verified successfully.",

            resetToken:
                resetToken

        });

    } catch (error) {

        console.error(
            "VERIFY RESET OTP ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to verify reset code."
        });

    }

};

// ========================================
// RESET PASSWORD
// ========================================

const resetPassword = async (req, res) => {

    try {

        const email =
            String(
                req.body.email || ""
            )
                .trim()
                .toLowerCase();

        const resetToken =
            String(
                req.body.resetToken || ""
            )
                .trim();

        const newPassword =
            String(
                req.body.newPassword || ""
            );

        // --------------------------------
        // REQUIRED FIELDS
        // --------------------------------

        if (
            !email ||
            !resetToken ||
            !newPassword
        ) {

            return res.status(400).json({
                message:
                    "Email, reset token, and new password are required."
            });

        }

        // --------------------------------
        // PASSWORD VALIDATION
        // --------------------------------

        const passwordError =
            getPasswordError(
                newPassword
            );

        if (passwordError) {

            return res.status(400).json({
                message:
                    passwordError
            });

        }

        // --------------------------------
        // FIND USER
        // --------------------------------

        const [users] =
            await pool.query(
                `
                SELECT
                    user_id,
                    email,
                    reset_token,
                    reset_token_expires
                FROM users
                WHERE LOWER(email) = ?
                LIMIT 1
                `,
                [email]
            );

        if (users.length === 0) {

            return res.status(404).json({
                message:
                    "Account not found."
            });

        }

        const user =
            users[0];

        // --------------------------------
        // CHECK RESET TOKEN
        // --------------------------------

        if (
            !user.reset_token ||
            user.reset_token !== resetToken
        ) {

            return res.status(400).json({
                message:
                    "Invalid or expired reset session."
            });

        }

        // --------------------------------
        // CHECK TOKEN EXPIRATION
        // --------------------------------

        if (
            !user.reset_token_expires ||
            new Date(
                user.reset_token_expires
            ) < new Date()
        ) {

            return res.status(400).json({
                message:
                    "Reset session has expired. Please start again."
            });

        }

        // --------------------------------
        // HASH NEW PASSWORD
        // --------------------------------

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                12
            );

        // --------------------------------
        // UPDATE PASSWORD
        // --------------------------------

        await pool.query(
            `
            UPDATE users
            SET
                password_hash = ?,
                reset_token = NULL,
                reset_token_expires = NULL,
                reset_otp = NULL,
                reset_otp_expires = NULL
            WHERE user_id = ?
            `,
            [
                hashedPassword,
                user.user_id
            ]
        );

        // --------------------------------
        // RESPONSE
        // --------------------------------

        return res.json({

            success:
                true,

            message:
                "Password reset successfully."

        });

    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to reset password."
        });

    }

};

// ========================================
// EXPORT
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
