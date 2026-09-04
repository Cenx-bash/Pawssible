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

const express = require("express");
const cors = require("cors");
const pool = require("./config/database");

const { verifyEmailConnection } = require("./services/email.service");

// ========================================
// EXPRESS APP
// ========================================

const app = express();

// ========================================
// SERVER CONFIGURATION
// ========================================

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const frontendPath = path.join(__dirname, "../frontend");
const pagesPath = path.join(__dirname, "../frontend/pages");

// ========================================
// ENVIRONMENT CHECK
// ========================================

console.log("");
console.log("========================================");
console.log("        ENVIRONMENT CHECK");
console.log("========================================");
console.log("SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
console.log("SMTP_USER:", process.env.SMTP_USER || "NOT SET");
console.log("SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "LOADED" : "NOT SET");
console.log("DB_HOST:", process.env.DB_HOST || "NOT SET");
console.log("DB_NAME:", process.env.DB_NAME || "NOT SET");
console.log("FRONTEND:", frontendPath);
console.log("========================================");
console.log("");

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ========================================
// STATIC FRONTEND FILES
// ========================================

app.use(express.static(frontendPath));
app.use(express.static(pagesPath));

// ========================================
// FRONTEND ROUTES
// ========================================
//
// Some pages live directly in frontend/, others live in
// frontend/pages/. Each entry below says which folder to
// use so sendFile looks in the right place.
// ========================================

const pages = [
    { name: "login", dir: frontendPath },
    { name: "register", dir: frontendPath },
    { name: "verify-email", dir: frontendPath },
    { name: "forgot-password", dir: frontendPath },
    { name: "reset-password", dir: frontendPath },
    { name: "dashboard", dir: pagesPath },
    { name: "animals", dir: pagesPath },
    { name: "animal-profile", dir: pagesPath },
    { name: "rescue-ops", dir: pagesPath },
    { name: "shelters", dir: pagesPath },
    { name: "shelter-profile", dir: pagesPath },
    { name: "reviews", dir: pagesPath },
    { name: "profile", dir: pagesPath },
    { name: "settings", dir: pagesPath },
    { name: "admin", dir: pagesPath },
    { name: "resource-library", dir: pagesPath }
];

pages.forEach(({ name, dir }) => {
    app.get(`/${name}.html`, (req, res) => {
        res.sendFile(path.join(dir, `${name}.html`), (error) => {
            if (error) {
                console.error(`${name.toUpperCase()} PAGE ERROR:`, error);
                if (!res.headersSent) {
                    res.status(404).json({
                        message: `${name}.html not found`,
                        path: path.join(dir, `${name}.html`)
                    });
                }
            }
        });
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "login.html"), (error) => {
        if (error) {
            console.error("LOGIN PAGE ERROR:", error);
            if (!res.headersSent) {
                res.status(404).json({
                    message: "login.html not found",
                    path: path.join(frontendPath, "login.html")
                });
            }
        }
    });
});

// ========================================
// API ROUTES (with error handling)
// ========================================
//
// IMPORTANT: This version of tryRequire only returns
// a route module if it is an actual function (a valid
// Express Router). If a route file exports something
// else (like a plain object of controller functions by
// mistake), it will be SKIPPED with a warning instead of
// crashing the whole server with:
//
//   TypeError: Router.use() requires a middleware
//   function but got a Object
//
// Watch the console output below when starting the
// server - it will tell you exactly which route file is
// broken and what it exported instead of a router.
// ========================================

function tryRequire(modulePath) {
    try {
        const module = require(modulePath);

        if (typeof module === "function") {
            return module;
        }

        console.warn(
            `Module ${modulePath} did NOT export a valid router/function.`
        );
        console.warn(
            `   -> typeof export: ${typeof module}`
        );
        console.warn(
            `   -> value:`, module
        );
        console.warn(
            `   -> Fix: make sure this file ends with "module.exports = router;" where "router" is an express.Router() instance.`
        );

        return null;

    } catch (error) {
        console.warn(`Could not load ${modulePath}:`, error.message);
        return null;
    }
}

// Auth Routes
const authRoutes = tryRequire("./routes/auth.routes");
if (authRoutes) app.use("/api/auth", authRoutes);
else console.warn("Auth routes not loaded");

// Animal Routes
const animalRoutes = tryRequire("./routes/animals.routes");
if (animalRoutes) app.use("/api/animals", animalRoutes);
else console.warn("Animal routes not loaded");

// Rescue Routes
const rescueRoutes = tryRequire("./routes/rescue.routes");
if (rescueRoutes) app.use("/api/rescue", rescueRoutes);
else console.warn("Rescue routes not loaded");

// Shelter Routes
const shelterRoutes = tryRequire("./routes/shelters.routes");
if (shelterRoutes) app.use("/api/shelters", shelterRoutes);
else console.warn("Shelter routes not loaded");

// Profile Routes
const profileRoutes = tryRequire("./routes/profile.routes");
if (profileRoutes) app.use("/api/profile", profileRoutes);
else console.warn("Profile routes not loaded");

// Review Routes
const reviewRoutes = tryRequire("./routes/reviews.routes");
if (reviewRoutes) app.use("/api/reviews", reviewRoutes);
else console.warn("Review routes not loaded");

// Admin Routes
const adminRoutes = tryRequire("./routes/admin.routes");
if (adminRoutes) app.use("/api/admin", adminRoutes);
else console.warn("Admin routes not loaded");

// User Routes
const userRoutes = tryRequire("./routes/users.routes");
if (userRoutes) app.use("/api/users", userRoutes);
else console.warn("User routes not loaded");

// ========================================
// API ROOT
// ========================================

app.get("/api", (req, res) => {
    res.json({
        application: "Pawssible",
        message: "Pawssible API is running - Stray Animal Rescue System",
        status: "success",
        endpoints: {
            auth: "/api/auth",
            login: "/api/auth/login",
            register: "/api/auth/register",
            verifyOTP: "/api/auth/verify-otp",
            resendOTP: "/api/auth/resend-otp",
            forgotPassword: "/api/auth/forgot-password",
            verifyResetOTP: "/api/auth/verify-reset-otp",
            resetPassword: "/api/auth/reset-password",
            animals: "/api/animals",
            rescue: "/api/rescue",
            shelters: "/api/shelters",
            profile: "/api/profile",
            reviews: "/api/reviews",
            admin: "/api/admin",
            users: "/api/users",
            database: "/api/test-db",
            status: "/api/status"
        }
    });
});

// ========================================
// DATABASE TEST
// ========================================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");
        res.json({
            message: "Database connection successful",
            database: "pawssible",
            result: rows[0].result
        });
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// ========================================
// SERVER STATUS
// ========================================

app.get("/api/status", (req, res) => {
    res.json({
        application: "Pawssible",
        status: "running",
        version: "1.0.0",
        port: PORT,
        host: HOST,
        timestamp: new Date().toISOString()
    });
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        path: req.originalUrl,
        method: req.method
    });
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
    console.error("SERVER ERROR:", error);
    res.status(error.status || 500).json({
        message: error.message || "Internal server error"
    });
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
    try {
        await pool.query("SELECT 1");
        console.log("MySQL connection successful");

        const emailConnected = await verifyEmailConnection();
        if (!emailConnected) {
            console.warn("WARNING: Email service could not be verified.");
            console.warn("The server will still start, but OTP emails may fail.");
        }

        const fs = require("fs");
        const loginFile = path.join(frontendPath, "login.html");
        if (fs.existsSync(loginFile)) {
            console.log("Frontend found: " + loginFile);
        } else {
            console.warn("WARNING: login.html was not found.");
            console.warn("Expected location: " + loginFile);
        }

        app.listen(PORT, HOST, () => {
            console.log("");
            console.log("========================================");
            console.log("        Pawssible Server");
            console.log("   Stray Animal Rescue System");
            console.log("========================================");
            console.log("Local:     http://localhost:" + PORT);
            console.log("Login:     http://localhost:" + PORT + "/login.html");
            console.log("Register:  http://localhost:" + PORT + "/register.html");
            console.log("Verify:    http://localhost:" + PORT + "/verify-email.html");
            console.log("Forgot:    http://localhost:" + PORT + "/forgot-password.html");
            console.log("Reset:     http://localhost:" + PORT + "/reset-password.html");
            console.log("Dashboard: http://localhost:" + PORT + "/dashboard.html");
            console.log("Animals:   http://localhost:" + PORT + "/animals.html");
            console.log("Rescue:    http://localhost:" + PORT + "/rescue-ops.html");
            console.log("Shelters:  http://localhost:" + PORT + "/shelters.html");
            console.log("API:       http://localhost:" + PORT + "/api");
            console.log("DB Test:   http://localhost:" + PORT + "/api/test-db");
            console.log("Status:    http://localhost:" + PORT + "/api/status");
            console.log("========================================");
            console.log("");
        });

    } catch (error) {
        console.error("");
        console.error("FAILED TO START PAWSSIBLE");
        console.error("========================================");
        console.error(error.message);
        console.error("========================================");
        console.error("");
        process.exit(1);
    }
}

// ========================================
// RUN SERVER
// ========================================

startServer();

module.exports = app;