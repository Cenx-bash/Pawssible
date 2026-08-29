const express = require("express");

const {
    getProfile,
    updateProfile
} = require("../controllers/profile.controller");

const authenticateToken =
    require("../middleware/auth.middleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getProfile
);

router.put(
    "/",
    authenticateToken,
    updateProfile
);

module.exports = router;