const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendOTP(email, otp) {
    const mailOptions = {
        from: `"PetCareConnect" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "PetCareConnect - Email Verification Code",

        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>PetCareConnect OTP</title>
        </head>

        <body style="
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
        ">

            <div style="
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            ">

                <h1 style="
                    color: #222;
                    text-align: center;
                ">
                    PetCareConnect
                </h1>

                <h2 style="
                    text-align: center;
                    color: #333;
                ">
                    Verify Your Email
                </h2>

                <p style="
                    color: #555;
                    font-size: 16px;
                    line-height: 1.6;
                ">
                    Thank you for creating a PetCareConnect account.
                    Use the verification code below to complete your registration.
                </p>

                <div style="
                    margin: 30px 0;
                    text-align: center;
                ">

                    <div style="
                        display: inline-block;
                        padding: 20px 35px;
                        background-color: #f0f0f0;
                        border-radius: 10px;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        color: #222;
                    ">
                        ${otp}
                    </div>

                </div>

                <p style="
                    text-align: center;
                    color: #777;
                ">
                    This code will expire in <strong>5 minutes</strong>.
                </p>

                <p style="
                    color: #777;
                    font-size: 14px;
                    line-height: 1.5;
                ">
                    If you did not create a PetCareConnect account,
                    you can safely ignore this email.
                </p>

            </div>

        </body>
        </html>
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendOTP
};