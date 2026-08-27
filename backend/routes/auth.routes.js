const express = require("express");

const {
    register,
    login,
    verifyOTP,
    resendOTP
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "PetCareConnect Auth API is working",
        status: "success"
    });
});

router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);

router.post(
    "/verify-otp",
    verifyOTP
);

router.post(
    "/resend-otp",
    resendOTP
);

module.exports = router;