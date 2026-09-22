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

router.post("/register", register);

router.post("/login", login);

router.post("/verify-otp", verifyOTP);

router.post("/resend-otp", resendOTP);

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetOTP);

router.post("/reset-password", resetPassword);

module.exports = router;