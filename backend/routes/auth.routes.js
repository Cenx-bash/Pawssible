const express = require("express");

const {
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} = require("../controllers/auth.controller");

const router = express.Router();

// ========================================
// REGISTER
// ========================================

router.post(
    "/register",
    register
);

// ========================================
// LOGIN
// ========================================

router.post(
    "/login",
    login
);

// ========================================
// REGISTRATION OTP
// ========================================

router.post(
    "/verify-otp",
    verifyOTP
);

router.post(
    "/resend-otp",
    resendOTP
);

// ========================================
// FORGOT PASSWORD
// ========================================

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/verify-reset-otp",
    verifyResetOTP
);

router.post(
    "/reset-password",
    resetPassword
);

// ========================================
// EXPORT
// ========================================

module.exports = router;