const pool = require("../config/database");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const {
    sendOTPEmail
} = require("../services/email.service");

// ========================================
// PENDING REGISTRATIONS
// ========================================

/*
 * IMPORTANT:
 *
 * This is temporary in-memory storage.
 *
 * If Node.js restarts, pending registrations
 * are lost.
 *
 * For your current school project this is okay.
 *
 * Later, this can be moved into MySQL or Redis.
 */

const pendingRegistrations = new Map();

const OTP_EXPIRATION_MS =
    5 * 60 * 1000;

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

        const otp = generateOTP();

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
        // RESPOND IMMEDIATELY
        // --------------------------------

        /*
         * IMPORTANT:
         *
         * The browser receives this response
         * immediately.
         *
         * We DO NOT await sendOTPEmail().
         */

        res.status(201).json({

            message:
                "Registration started. Please check your email for the OTP.",

            email: normalizedEmail,

            requiresVerification: true
        });

        // --------------------------------
        // SEND EMAIL IN BACKGROUND
        // --------------------------------

        sendOTPEmail(
            normalizedEmail,
            otp,
            firstName
        )
            .then(() => {

                console.log(
                    `OTP delivery completed for ${normalizedEmail}`
                );

            })
            .catch((error) => {

                console.error(
                    `OTP email failed for ${normalizedEmail}:`,
                    error.message
                );

                /*
                 * Remove the pending registration if
                 * email delivery failed.
                 *
                 * The user can simply register again.
                 */

                pendingRegistrations.delete(
                    normalizedEmail
                );
            });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({

                message:
                    "Registration failed"
            });
        }
    }
};

// ========================================
// VERIFY OTP
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
                    "OTP has expired. Please register again or request a new OTP."
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

        // Duplicate email safety

        if (
            error.code === "ER_DUP_ENTRY"
        ) {

            pendingRegistrations.delete(
                String(req.body.email)
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
// RESEND OTP
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

        pending.attempts = 0;

        // --------------------------------
        // UPDATE MEMORY FIRST
        // --------------------------------

        pendingRegistrations.set(
            normalizedEmail,
            pending
        );

        // --------------------------------
        // RESPOND IMMEDIATELY
        // --------------------------------

        res.json({

            message:
                "A new OTP is being sent to your email."
        });

        // --------------------------------
        // SEND IN BACKGROUND
        // --------------------------------

        sendOTPEmail(
            normalizedEmail,
            newOTP,
            pending.first_name
        )
            .then(() => {

                console.log(
                    `Resent OTP to ${normalizedEmail}`
                );

            })
            .catch((error) => {

                console.error(
                    `Resend OTP failed for ${normalizedEmail}:`,
                    error.message
                );
            });

    } catch (error) {

        console.error(
            "RESEND OTP ERROR:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({

                message:
                    "Unable to resend OTP"
            });
        }
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
                    expiresIn: "1d"
                }
            );

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
// EXPORT
// ========================================

module.exports = {

    register,

    login,

    verifyOTP,

    resendOTP
};