const nodemailer = require("nodemailer");

// ========================================
// CONFIGURATION
// ========================================

const APP_NAME = "Pawssible";
const APP_DESCRIPTION =
    "Stray Animal Rescue & Assistance Management System";

const COLORS = {
    dark: "#18251F",
    darkSoft: "#53645B",
    cream: "#FFFAF0",
    paper: "#F3EAD8",
    accent: "#E4572E",
    accentSoft: "#F7CDBD",
    sage: "#799486",
    white: "#FFFFFF",
    black: "#000000"
};

// ========================================
// EMAIL TRANSPORTER
// ========================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),

    // Gmail port 587 uses STARTTLS
    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },

    tls: {
        rejectUnauthorized: true
    }
});

// ========================================
// SECURITY
// ========================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character]));
}

// ========================================
// PIXEL EMAIL TEMPLATE
// ========================================

function createOTPEmail({
    firstName = "there",
    otp,
    type = "verification",
    expirationMinutes = 5
}) {
    const safeFirstName = escapeHTML(firstName);
    const safeOTP = escapeHTML(otp);

    const isReset = type === "reset";

    const title = isReset
        ? "PASSWORD RESET"
        : "VERIFY YOUR EMAIL";

    const message = isReset
        ? `
            We received a request to reset your
            Pawssible password.
        `
        : `
            Thank you for creating your Pawssible account.
            Use the code below to complete your registration.
        `;

    const warning = isReset
        ? `
            If you did not request a password reset,
            you can safely ignore this email.
        `
        : `
            If you did not create a Pawssible account,
            you can safely ignore this email.
        `;

    const subject = isReset
        ? "Pawssible - Password Reset Code"
        : "Pawssible - Your Email Verification Code";

    const plainText = isReset
        ? `Hello ${firstName},

We received a request to reset your Pawssible password.

Your password reset code is:

${otp}

This code will expire in ${expirationMinutes} minutes.

If you did not request a password reset, you can safely ignore this email.

Pawssible
${APP_DESCRIPTION}`
        : `Hello ${firstName},

Welcome to Pawssible!

Your email verification code is:

${otp}

This code will expire in ${expirationMinutes} minutes.

If you did not create a Pawssible account, you can safely ignore this email.

Pawssible
${APP_DESCRIPTION}`;

    const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>${APP_NAME}</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background-color:#D9D0B9;
        font-family:Arial,Helvetica,sans-serif;
        color:${COLORS.dark};
    "
>

<!-- OUTER BACKGROUND -->
<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background-color:#D9D0B9;
        margin:0;
        padding:0;
    "
>
<tr>
<td align="center" style="padding:35px 15px;">

    <!-- MAIN EMAIL -->
    <table
        width="600"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width:100%;
            max-width:600px;
            background-color:${COLORS.cream};
            border:4px solid ${COLORS.dark};
        "
    >

        <!-- ========================================
             HEADER
        ========================================= -->

        <tr>
            <td
                align="center"
                style="
                    background-color:${COLORS.dark};
                    padding:30px 25px;
                    border-bottom:5px solid ${COLORS.accent};
                "
            >

                <!-- PIXEL PAW -->
                <div
                    style="
                        display:inline-block;
                        width:48px;
                        height:48px;
                        line-height:48px;
                        background-color:${COLORS.accent};
                        color:#FFFFFF;
                        border:3px solid #FFFFFF;
                        font-size:25px;
                        font-weight:bold;
                        margin-bottom:14px;
                    "
                >
                    🐾
                </div>

                <div
                    style="
                        color:#FFFFFF;
                        font-size:22px;
                        line-height:30px;
                        font-weight:900;
                        letter-spacing:2px;
                    "
                >
                    ${APP_NAME}
                </div>

                <div
                    style="
                        color:#BFD0C7;
                        font-size:12px;
                        line-height:18px;
                        margin-top:7px;
                        letter-spacing:1px;
                    "
                >
                    STRAY ANIMAL RESCUE &amp; ASSISTANCE
                </div>

            </td>
        </tr>

        <!-- ========================================
             PIXEL DECORATION
        ========================================= -->

        <tr>
            <td
                style="
                    height:10px;
                    background-color:${COLORS.accent};
                    font-size:0;
                    line-height:0;
                "
            >
                &nbsp;
            </td>
        </tr>

        <!-- ========================================
             BODY
        ========================================= -->

        <tr>
            <td
                align="center"
                style="
                    padding:40px 30px 25px;
                "
            >

                <!-- TITLE -->

                <div
                    style="
                        color:${COLORS.dark};
                        font-size:22px;
                        line-height:30px;
                        font-weight:900;
                        letter-spacing:1px;
                        margin-bottom:15px;
                    "
                >
                    ${title}
                </div>

                <!-- PIXEL DIVIDER -->

                <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="margin:0 auto 22px;"
                >
                    <tr>
                        <td
                            width="12"
                            height="6"
                            style="
                                background-color:${COLORS.accent};
                            "
                        ></td>

                        <td
                            width="6"
                            style="
                                background-color:${COLORS.dark};
                            "
                        ></td>

                        <td
                            width="12"
                            style="
                                background-color:${COLORS.accent};
                            "
                        ></td>

                        <td
                            width="6"
                            style="
                                background-color:${COLORS.dark};
                            "
                        ></td>

                        <td
                            width="12"
                            style="
                                background-color:${COLORS.accent};
                            "
                        ></td>
                    </tr>
                </table>

                <!-- GREETING -->

                <div
                    style="
                        color:${COLORS.darkSoft};
                        font-size:15px;
                        line-height:25px;
                    "
                >
                    Hello
                    <strong style="color:${COLORS.dark};">
                        ${safeFirstName}
                    </strong>,
                    <br><br>

                    ${message}
                </div>

                <!-- ========================================
                     OTP BOX
                ========================================= -->

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        margin:30px 0 20px;
                        background-color:${COLORS.paper};
                        border:4px solid ${COLORS.dark};
                    "
                >
                    <tr>
                        <td
                            align="center"
                            style="
                                padding:8px;
                                background-color:${COLORS.dark};
                                color:#FFFFFF;
                                font-size:10px;
                                line-height:16px;
                                font-weight:bold;
                                letter-spacing:2px;
                            "
                        >
                            YOUR CODE
                        </td>
                    </tr>

                    <tr>
                        <td
                            align="center"
                            style="
                                padding:22px 10px;
                            "
                        >

                            <!-- OTP -->
                            <div
                                style="
                                    color:${COLORS.accent};
                                    font-size:34px;
                                    line-height:45px;
                                    font-weight:900;
                                    letter-spacing:9px;
                                    font-family:
                                        'Courier New',
                                        Courier,
                                        monospace;
                                "
                            >
                                ${safeOTP}
                            </div>

                        </td>
                    </tr>
                </table>

                <!-- ========================================
                     EXPIRATION
                ========================================= -->

                <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        margin:0 auto 25px;
                    "
                >
                    <tr>

                        <td
                            style="
                                background-color:${COLORS.accent};
                                color:#FFFFFF;
                                border:3px solid ${COLORS.dark};
                                padding:8px 12px;
                                font-size:12px;
                                line-height:16px;
                                font-weight:bold;
                            "
                        >
                            EXPIRES IN
                        </td>

                        <td
                            style="
                                background-color:${COLORS.cream};
                                color:${COLORS.dark};
                                border-top:3px solid ${COLORS.dark};
                                border-right:3px solid ${COLORS.dark};
                                border-bottom:3px solid ${COLORS.dark};
                                padding:8px 14px;
                                font-size:12px;
                                line-height:16px;
                                font-weight:bold;
                            "
                        >
                            ${expirationMinutes} MINUTES
                        </td>

                    </tr>
                </table>

                <!-- ========================================
                     WARNING
                ========================================= -->

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        background-color:${COLORS.accentSoft};
                        border:3px solid ${COLORS.dark};
                    "
                >
                    <tr>
                        <td
                            style="
                                padding:15px;
                                color:${COLORS.dark};
                                font-size:12px;
                                line-height:20px;
                                text-align:left;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    margin-bottom:5px;
                                    font-size:12px;
                                "
                            >
                                SECURITY NOTICE
                            </strong>

                            ${warning}

                        </td>
                    </tr>
                </table>

            </td>
        </tr>

        <!-- ========================================
             FOOTER
        ========================================= -->

        <tr>
            <td
                align="center"
                style="
                    background-color:${COLORS.paper};
                    border-top:4px solid ${COLORS.dark};
                    padding:22px 20px;
                "
            >

                <div
                    style="
                        color:${COLORS.dark};
                        font-size:13px;
                        line-height:20px;
                        font-weight:900;
                        letter-spacing:1px;
                    "
                >
                    ${APP_NAME}
                </div>

                <div
                    style="
                        color:${COLORS.darkSoft};
                        font-size:11px;
                        line-height:18px;
                        margin-top:5px;
                    "
                >
                    ${APP_DESCRIPTION}
                </div>

                <!-- PIXEL FOOTER -->

                <table
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        margin:15px auto 0;
                    "
                >
                    <tr>

                        <td
                            width="8"
                            height="8"
                            style="
                                background-color:${COLORS.accent};
                            "
                        ></td>

                        <td width="5"></td>

                        <td
                            width="8"
                            height="8"
                            style="
                                background-color:${COLORS.dark};
                            "
                        ></td>

                        <td width="5"></td>

                        <td
                            width="8"
                            height="8"
                            style="
                                background-color:${COLORS.sage};
                            "
                        ></td>

                        <td width="5"></td>

                        <td
                            width="8"
                            height="8"
                            style="
                                background-color:${COLORS.accent};
                            "
                        ></td>

                    </tr>
                </table>

            </td>
        </tr>

    </table>

</td>
</tr>
</table>

</body>
</html>
`;

    return {
        subject,
        text: plainText,
        html
    };
}

// ========================================
// VERIFY EMAIL CONNECTION
// ========================================

async function verifyEmailConnection() {
    try {
        await transporter.verify();

        console.log("========================================");
        console.log("EMAIL SERVICE CONNECTED");
        console.log(`Email account: ${process.env.SMTP_USER}`);
        console.log("========================================");

        return true;

    } catch (error) {

        console.error("========================================");
        console.error("EMAIL SERVICE CONNECTION FAILED");
        console.error(`Code: ${error.code || "N/A"}`);
        console.error(`Response: ${error.response || "N/A"}`);
        console.error(`Error: ${error.message}`);
        console.error("========================================");

        return false;
    }
}

// ========================================
// SEND REGISTRATION OTP
// ========================================

async function sendOTPEmail(
    email,
    otp,
    firstName = "there"
) {
    const template = createOTPEmail({
        firstName,
        otp,
        type: "verification",
        expirationMinutes: 5
    });

    const mailOptions = {
        from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
        to: email,

        subject: template.subject,

        text: template.text,

        html: template.html
    };

    try {

        const info = await transporter.sendMail(
            mailOptions
        );

        console.log("========================================");
        console.log("OTP EMAIL SENT SUCCESSFULLY");
        console.log(`To: ${email}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log("========================================");

        return info;

    } catch (error) {

        console.error("========================================");
        console.error("OTP EMAIL FAILED");
        console.error(`To: ${email}`);
        console.error(`Code: ${error.code || "N/A"}`);
        console.error(`Response: ${error.response || "N/A"}`);
        console.error(`Command: ${error.command || "N/A"}`);
        console.error(`Error: ${error.message}`);
        console.error("========================================");

        throw error;
    }
}

// ========================================
// SEND PASSWORD RESET OTP
// ========================================

async function sendPasswordResetOTP(
    email,
    otp,
    firstName = "there"
) {
    const template = createOTPEmail({
        firstName,
        otp,
        type: "reset",
        expirationMinutes: 10
    });

    const mailOptions = {
        from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
        to: email,

        subject: template.subject,

        text: template.text,

        html: template.html
    };

    try {

        const info = await transporter.sendMail(
            mailOptions
        );

        console.log("========================================");
        console.log("PASSWORD RESET EMAIL SENT SUCCESSFULLY");
        console.log(`To: ${email}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log("========================================");

        return info;

    } catch (error) {

        console.error("========================================");
        console.error("PASSWORD RESET EMAIL FAILED");
        console.error(`To: ${email}`);
        console.error(`Code: ${error.code || "N/A"}`);
        console.error(`Response: ${error.response || "N/A"}`);
        console.error(`Command: ${error.command || "N/A"}`);
        console.error(`Error: ${error.message}`);
        console.error("========================================");

        throw error;
    }
}

// ========================================
// COMPATIBILITY ALIAS
// ========================================

const sendPasswordResetEmail =
    sendPasswordResetOTP;

// ========================================
// EXPORT
// ========================================

module.exports = {
    sendOTPEmail,
    sendPasswordResetOTP,
    sendPasswordResetEmail,
    verifyEmailConnection
};