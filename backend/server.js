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

const authRoutes = require("./routes/auth.routes");
const petRoutes = require("./routes/pets.routes");

const {
    verifyEmailConnection
} = require("./services/email.service");


// ========================================
// EXPRESS APP
// ========================================

const app = express();


// ========================================
// SERVER CONFIGURATION
// ========================================

const PORT = Number(process.env.PORT) || 3000;

const HOST = "0.0.0.0";

const frontendPath =
    path.join(__dirname, "../frontend");


// ========================================
// CHECK ENVIRONMENT VARIABLES
// ========================================

console.log("");
console.log("========================================");
console.log("        ENVIRONMENT CHECK");
console.log("========================================");

console.log(
    "SMTP_HOST:",
    process.env.SMTP_HOST || "NOT SET"
);

console.log(
    "SMTP_PORT:",
    process.env.SMTP_PORT || "NOT SET"
);

console.log(
    "SMTP_USER:",
    process.env.SMTP_USER || "NOT SET"
);

console.log(
    "SMTP_PASSWORD:",
    process.env.SMTP_PASSWORD
        ? "LOADED"
        : "NOT SET"
);

console.log(
    "DB_HOST:",
    process.env.DB_HOST || "NOT SET"
);

console.log(
    "DB_NAME:",
    process.env.DB_NAME || "NOT SET"
);

console.log("========================================");
console.log("");


// ========================================
// MIDDLEWARE
// ========================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ========================================
// REQUEST LOGGER
// ========================================

app.use((req, res, next) => {

    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
});


// ========================================
// FRONTEND
// ========================================

// Homepage

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "login.html"
        )
    );

});


// ========================================
// LOGIN PAGE
// ========================================

app.get("/login.html", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "login.html"
        )
    );

});


// ========================================
// REGISTER PAGE
// ========================================

app.get("/register.html", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "register.html"
        )
    );

});


// ========================================
// VERIFY OTP PAGE
// ========================================

app.get("/verify.html", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "verify-otp.html"
        )
    );

});


// ========================================
// STATIC FRONTEND FILES
// ========================================

app.use(
    express.static(frontendPath)
);


// ========================================
// API ROOT
// ========================================

app.get("/api", (req, res) => {

    res.json({

        application:
            "PetCareConnect",

        message:
            "PetCareConnect API is running",

        status:
            "success",

        endpoints: {

            auth:
                "/api/auth",

            login:
                "/api/auth/login",

            register:
                "/api/auth/register",

            verifyOTP:
                "/api/auth/verify-otp",

            resendOTP:
                "/api/auth/resend-otp",

            pets:
                "/api/pets",

            database:
                "/api/test-db",

            status:
                "/api/status"

        }

    });

});


// ========================================
// AUTH ROUTES
// ========================================

app.use(
    "/api/auth",
    authRoutes
);


// ========================================
// PET ROUTES
// ========================================

app.use(
    "/api/pets",
    petRoutes
);


// ========================================
// DATABASE TEST
// ========================================

app.get(
    "/api/test-db",
    async (req, res) => {

        try {

            const [rows] =
                await pool.query(
                    "SELECT 1 AS result"
                );

            res.json({

                message:
                    "Database connection successful",

                database:
                    "petcareconnect",

                result:
                    rows[0].result

            });

        } catch (error) {

            console.error(
                "DATABASE ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Database connection failed",

                error:
                    error.message

            });

        }

    }
);


// ========================================
// SERVER STATUS
// ========================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            application:
                "PetCareConnect",

            status:
                "running",

            port:
                PORT,

            host:
                HOST,

            timestamp:
                new Date().toISOString()

        });

    }
);


// ========================================
// 404 HANDLER
// ========================================

app.use(
    (req, res) => {

        res.status(404).json({

            message:
                "Route not found",

            path:
                req.originalUrl,

            method:
                req.method

        });

    }
);


// ========================================
// ERROR HANDLER
// ========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "SERVER ERROR:",
            error
        );

        res.status(
            error.status || 500
        ).json({

            message:
                error.message ||
                "Internal server error"

        });

    }
);


// ========================================
// START SERVER
// ========================================

async function startServer() {

    try {

        // ====================================
        // TEST MYSQL
        // ====================================

        await pool.query(
            "SELECT 1"
        );

        console.log(
            "MySQL connection successful"
        );


        // ====================================
        // TEST EMAIL
        // ====================================

        await verifyEmailConnection();


        // ====================================
        // START EXPRESS
        // ====================================

        app.listen(
            PORT,
            HOST,
            () => {

                console.log("");

                console.log(
                    "========================================"
                );

                console.log(
                    "        PetCareConnect Server"
                );

                console.log(
                    "========================================"
                );

                console.log(
                    `Local:     http://localhost:${PORT}`
                );

                console.log(
                    `Login:     http://localhost:${PORT}/login.html`
                );

                console.log(
                    `Register:  http://localhost:${PORT}/register.html`
                );

                console.log(
                    `Verify:    http://localhost:${PORT}/verify.html`
                );

                console.log(
                    `API:       http://localhost:${PORT}/api`
                );

                console.log(
                    `DB Test:   http://localhost:${PORT}/api/test-db`
                );

                console.log(
                    "========================================"
                );

                console.log("");

            }
        );

    } catch (error) {

        console.error("");

        console.error(
            "FAILED TO START PETCARECONNECT"
        );

        console.error(
            "========================================"
        );

        console.error(
            error.message
        );

        console.error(
            "========================================"
        );

        console.error("");

        process.exit(1);

    }

}


// ========================================
// RUN SERVER
// ========================================

startServer();