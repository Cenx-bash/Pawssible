require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const app = require("./server");
const path = require("path");
const fs = require("fs");
const { verifyEmailConnection } = require("./services/email.service");
const pool = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const frontendPath = path.join(__dirname, "../frontend");

async function startServer() {
    try {
        console.log("");

        console.log("========================================");
        console.log("        PAWSSIBLE ENVIRONMENT");
        console.log("========================================");

        console.log("SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
        console.log("SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
        console.log("SMTP_USER:", process.env.SMTP_USER || "NOT SET");
        console.log(
            "SMTP_PASSWORD:",
            process.env.SMTP_PASSWORD ? "LOADED" : "NOT SET"
        );

        console.log("DB_HOST:", process.env.DB_HOST || "NOT SET");
        console.log("DB_NAME:", process.env.DB_NAME || "NOT SET");
        console.log("FRONTEND:", frontendPath);

        console.log("========================================");
        console.log("");

        // Test database
        await pool.query("SELECT 1");
        console.log("MySQL connection: SUCCESS");

        // Test email
        const emailConnected = await verifyEmailConnection();

        if (emailConnected) {
            console.log("Email service connection: SUCCESS");
        } else {
            console.warn("WARNING: Email service could not be verified.");
            console.warn("OTP emails may fail.");
        }

        // Check frontend
        const loginFile = path.join(frontendPath, "login.html");

        if (fs.existsSync(loginFile)) {
            console.log("Frontend found:", loginFile);
        } else {
            console.warn("WARNING: login.html was not found.");
        }

        // Start local server
        app.listen(PORT, HOST, () => {
            console.log("");
            console.log("========================================");
            console.log("          PAWSSIBLE SERVER");
            console.log("========================================");

            console.log(`Local:     http://localhost:${PORT}`);
            console.log(`Login:     http://localhost:${PORT}/login.html`);
            console.log(`Register:  http://localhost:${PORT}/register.html`);
            console.log(`Dashboard: http://localhost:${PORT}/pages/dashboard.html`);
            console.log(`Animals:   http://localhost:${PORT}/pages/animals.html`);
            console.log(`Rescue:    http://localhost:${PORT}/pages/rescue-ops.html`);
            console.log(`Shelters:  http://localhost:${PORT}/pages/shelters.html`);
            console.log(`API:       http://localhost:${PORT}/api`);
            console.log(`DB Test:   http://localhost:${PORT}/api/test-db`);
            console.log(`Health:    http://localhost:${PORT}/api/health`);
            console.log(`Status:    http://localhost:${PORT}/api/status`);

            console.log("========================================");
            console.log("");
        });

    } catch (error) {
        console.error("");
        console.error("FAILED TO START PAWSSIBLE");
        console.error("========================================");
        console.error(error);
        console.error("========================================");
        console.error("");

        process.exit(1);
    }
}

startServer();