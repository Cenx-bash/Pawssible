const path = require("path");
const express = require("express");
const cors = require("cors");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const app = express();

// ========================================
// PATHS
// ========================================

const publicPath = path.join(__dirname, "../public");
const pagesPath = path.join(publicPath, "pages");

// ========================================
// CORS
// ========================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

// ========================================
// BODY PARSING
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ========================================
// STATIC FRONTEND
// ========================================

app.use(express.static(publicPath));

// ========================================
// MAIN FRONTEND ROUTES
// ========================================

const frontendRoutes = {
    "/": "login.html",
    "/login": "login.html",
    "/register": "register.html",
    "/verify-email": "verify-email.html",
    "/forgot-password": "forgot-password.html",
    "/reset-password": "reset-password.html"
};

Object.entries(frontendRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(publicPath, file));
    });
});

// ========================================
// PAGE ROUTES
// ========================================

const pageRoutes = [
    "dashboard",
    "animals",
    "animal-profile",
    "rescue-ops",
    "shelters",
    "shelter-profile",
    "reviews",
    "profile",
    "settings",
    "admin",
    "admin-dashboard",
    "animals-admin",
    "announcements-admin",
    "profile-admin",
    "resource-library"
];

pageRoutes.forEach((page) => {
    app.get(`/pages/${page}`, (req, res) => {
        res.sendFile(path.join(pagesPath, `${page}.html`));
    });

    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(pagesPath, `${page}.html`));
    });
});

// ========================================
// API ROUTES
// ========================================
// IMPORTANT:
// Use direct require() statements.
// This allows Vercel to statically detect
// and bundle the route files correctly.

// Authentication
const authRoutes = require("./routes/auth.routes");

// Animals
const animalRoutes = require("./routes/animals.routes");

// Rescue operations
const rescueRoutes = require("./routes/rescue.routes");

// Shelters
const shelterRoutes = require("./routes/shelters.routes");

// User profile
const profileRoutes = require("./routes/profile.routes");

// Reviews
const reviewRoutes = require("./routes/reviews.routes");

// Admin
const adminRoutes = require("./routes/admin.routes");

// Users
const userRoutes = require("./routes/users.routes");

// ========================================
// MOUNT API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/rescue", rescueRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// ========================================
// API INFORMATION
// ========================================

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Pawssible API is running",
        version: "4.50.30",
        endpoints: {
            auth: "/api/auth",
            animals: "/api/animals",
            rescue: "/api/rescue",
            shelters: "/api/shelters",
            profile: "/api/profile",
            reviews: "/api/reviews",
            admin: "/api/admin",
            users: "/api/users"
        }
    });
});

// ========================================
// DATABASE TEST
// ========================================

app.get("/api/test-db", async (req, res) => {
    try {
        const pool = require("./config/database");

        const [rows] = await pool.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "Database connection successful",
            result: rows[0]
        });
    } catch (error) {
        console.error("Database test failed:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        service: "Pawssible API"
    });
});

// ========================================
// APPLICATION STATUS
// ========================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        application: "Pawssible",
        version: "4.50.30",
        environment: process.env.NODE_ENV || "development",
        database: process.env.DB_NAME || "not configured"
    });
});

// ========================================
// API 404 HANDLER
// ========================================

app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: "API endpoint not found"
        });
    }

    next();
});

// ========================================
// FRONTEND 404 HANDLER
// ========================================

app.use((req, res) => {
    res.status(404).send("Page not found");
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
    console.error("========================================");
    console.error("SERVER ERROR");
    console.error("========================================");
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ========================================
// EXPORT
// ========================================

module.exports = app;
