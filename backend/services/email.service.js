const nodemailer = require("nodemailer");

// ========================================
// EMAIL TRANSPORTER
// ========================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),

    // Gmail SMTP port 587 uses STARTTLS
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
// VERIFY EMAIL CONNECTION
// ========================================

async function verifyEmailConnection() {
    try {
        await transporter.verify();

        console.log(
            "Email service connected successfully."
        );

        console.log(
            `Email account: ${process.env.SMTP_USER}`
        );

        return true;

    } catch (error) {

        console.error(
            "Email service connection failed:"
        );

        console.error(error.message);

        return false;
    }
}

// ========================================
// SEND OTP EMAIL
// ========================================

async function sendOTPEmail(
    email,
    otp,
    firstName = "there"
) {

    const mailOptions = {

        // Sender
        from: `"PetCareConnect" <${process.env.SMTP_USER}>`,

        // Recipient
        to: email,

        // Email subject
        subject:
            "PetCareConnect - Your Email Verification Code",

        // Plain-text version
        text: `Hello ${firstName},

Welcome to PetCareConnect!

Your email verification code is:

${otp}

This code will expire in 5 minutes.

If you did not create a PetCareConnect account, you can safely ignore this email.

PetCareConnect
`,

        // HTML version
        html: `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        PetCareConnect Verification
    </title>

</head>

<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f0f4f8;
        font-family: Arial, Helvetica, sans-serif;
    "
>

    <div
        style="
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        "
    >

        <!-- ============================== -->
        <!-- HEADER -->
        <!-- ============================== -->

        <div
            style="
                background-color: #1e3c4f;
                padding: 35px 30px;
                text-align: center;
            "
        >

            <div
                style="
                    width: 64px;
                    height: 64px;
                    line-height: 64px;
                    margin: 0 auto 15px;
                    border-radius: 50%;
                    background-color: #2a4d62;
                    color: #f6d186;
                    font-size: 30px;
                "
            >
                ✉
            </div>

            <h1
                style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 25px;
                    font-weight: bold;
                "
            >
                PetCareConnect
            </h1>

        </div>


        <!-- ============================== -->
        <!-- BODY -->
        <!-- ============================== -->

        <div
            style="
                padding: 40px 30px;
                text-align: center;
            "
        >

            <h2
                style="
                    margin: 0 0 15px;
                    color: #1a1e2b;
                    font-size: 24px;
                "
            >
                Verify Your Email
            </h2>


            <p
                style="
                    margin: 0;
                    color: #64748b;
                    font-size: 15px;
                    line-height: 1.6;
                "
            >

                Hello ${firstName},

                <br>
                <br>

                Thank you for creating a
                PetCareConnect account.

                <br>

                Use the verification code below
                to complete your registration.

            </p>


            <!-- ============================== -->
            <!-- OTP -->
            <!-- ============================== -->

            <div
                style="
                    margin: 30px 0;
                    padding: 20px;
                    background-color: #f1f5f9;
                    border-radius: 16px;
                "
            >

                <div
                    style="
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 10px;
                        color: #1e3c4f;
                    "
                >
                    ${otp}
                </div>

            </div>


            <p
                style="
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                "
            >

                This verification code expires in

                <strong>
                    5 minutes
                </strong>.

            </p>


            <p
                style="
                    margin-top: 30px;
                    color: #94a3b8;
                    font-size: 13px;
                    line-height: 1.5;
                "
            >

                If you did not create a
                PetCareConnect account,
                you can safely ignore this email.

            </p>

        </div>


        <!-- ============================== -->
        <!-- FOOTER -->
        <!-- ============================== -->

        <div
            style="
                padding: 20px;
                background-color: #f8fafc;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
            "
        >

            PetCareConnect

            <br>

            Your trusted pet care platform

        </div>

    </div>

</body>

</html>
`
    };


    // ========================================
    // SEND EMAIL
    // ========================================

    try {

        const info =
            await transporter.sendMail(
                mailOptions
            );

        console.log(
            "========================================"
        );

        console.log(
            "OTP EMAIL SENT SUCCESSFULLY"
        );

        console.log(
            `To: ${email}`
        );

        console.log(
            `Message ID: ${info.messageId}`
        );

        console.log(
            "========================================"
        );

        return info;

    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "OTP EMAIL FAILED"
        );

        console.error(
            `To: ${email}`
        );

        console.error(
            `Error: ${error.message}`
        );

        console.error(
            "========================================"
        );

        throw error;
    }
}


// ========================================
// EXPORT
// ========================================

module.exports = {
    sendOTPEmail,
    verifyEmailConnection
};