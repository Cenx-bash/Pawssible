const path = require("path");
const express = require("express");
const cors = require("cors");

// Load environment variables from the project root
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const app = express();

// ============================================================
// PATHS
// ============================================================

const publicPath = path.join(__dirname, "../public");
const pagesPath = path.join(publicPath, "pages");

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ============================================================
// STATIC FRONTEND
// ============================================================

// Serve everything inside /public
//
// Example:
// /css/style.css
// /js/auth.js
// /login.html
// /pages/dashboard.html
//
app.use(express.static(publicPath));

// ============================================================
// FRONTEND ROUTES
// ============================================================

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

// ============================================================
// APPLICATION PAGE ROUTES
// ============================================================

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
    // /pages/dashboard
    app.get(`/pages/${page}`, (req, res) => {
        res.sendFile(path.join(pagesPath, `${page}.html`));
    });

    // /dashboard
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(pagesPath, `${page}.html`));
    });
});

// ============================================================
// ROUTE LOADER
// ============================================================

function tryRequire(routePath) {
    try {
        return require(routePath);
    } catch (error) {
        console.warn(`Route not loaded: ${routePath}`);
        console.warn(error.message);
        return null;
    }
}

// ============================================================
// API ROUTES
// ============================================================

const authRoutes = tryRequire("./routes/auth.routes");
const animalRoutes = tryRequire("./routes/animals.routes");
const rescueRoutes = tryRequire("./routes/rescue.routes");
const shelterRoutes = tryRequire("./routes/shelters.routes");
const profileRoutes = tryRequire("./routes/profile.routes");
const reviewRoutes = tryRequire("./routes/reviews.routes");
const adminRoutes = tryRequire("./routes/admin.routes");
const userRoutes = tryRequire("./routes/users.routes");

if (typeof authRoutes === "function") {
    app.use("/api/auth", authRoutes);
}

if (typeof animalRoutes === "function") {
    app.use("/api/animals", animalRoutes);
}

if (typeof rescueRoutes === "function") {
    app.use("/api/rescue", rescueRoutes);
}

if (typeof shelterRoutes === "function") {
    app.use("/api/shelters", shelterRoutes);
}

if (typeof profileRoutes === "function") {
    app.use("/api/profile", profileRoutes);
}

if (typeof reviewRoutes === "function") {
    app.use("/api/reviews", reviewRoutes);
}

if (typeof adminRoutes === "function") {
    app.use("/api/admin", adminRoutes);
}

if (typeof userRoutes === "function") {
    app.use("/api/users", userRoutes);
}

// ============================================================
// API INFORMATION
// ============================================================

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

// ============================================================
// DATABASE TEST
// ============================================================

app.get("/api/test-db", async (req, res) => {
    try {
        const pool = require("./config/database");

        const [rows] = await pool.query(
            "SELECT 1 AS result"
        );

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

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        service: "Pawssible API"
    });
});

// ============================================================
// STATUS
// ============================================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        application: "Pawssible",
        version: "4.50.30",
        environment:
            process.env.NODE_ENV || "development",
        database:
            process.env.DB_NAME || "not configured"
    });
});

// ============================================================
// API 404 HANDLER
// ============================================================

app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({
            success: false,
            message: "API endpoint not found"
        });
    }

    next();
});

// ============================================================
// FRONTEND 404 HANDLER
// ============================================================

app.use((req, res) => {
    res.status(404).send("Page not found");
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ============================================================
// VERCEL EXPORT
// ============================================================

module.exports = app;