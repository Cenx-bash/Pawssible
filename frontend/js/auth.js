// ========================================
// API CONFIGURATION
// ========================================

const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? `${window.location.protocol}//${window.location.host}`
        : window.location.origin;


// ========================================
// HELPER - JSON REQUEST
// ========================================

async function apiRequest(
    endpoint,
    options = {}
) {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let data;

    try {
        data = await response.json();
    } catch (error) {
        data = {
            message: "Invalid server response."
        };
    }

    return {
        response,
        data
    };
}


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

function setupPasswordToggles() {

    const toggleButtons =
        document.querySelectorAll(
            ".toggle-password"
        );

    toggleButtons.forEach(
        function (button) {

            if (
                button.dataset.passwordToggleInitialized ===
                "true"
            ) {
                return;
            }

            button.dataset.passwordToggleInitialized =
                "true";

            button.addEventListener(
                "click",
                function () {

                    const wrapper =
                        button.closest(
                            ".password-wrap"
                        );

                    if (!wrapper) {

                        console.error(
                            "Password wrapper not found."
                        );

                        return;
                    }

                    const input =
                        wrapper.querySelector(
                            "input"
                        );

                    if (!input) {

                        console.error(
                            "Password input not found."
                        );

                        return;
                    }

                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        button.textContent =
                            "Hide";

                        button.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "Show";

                        button.setAttribute(
                            "aria-label",
                            "Show password"
                        );
                    }
                }
            );
        }
    );
}


// ========================================
// LOGIN
// ========================================

function setupLoginForm() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {
        return;
    }

    const emailInput =
        document.getElementById(
            "email"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const message =
        document.getElementById(
            "loginMessage"
        );

    const button =
        form.querySelector(
            ".submit"
        );

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;

            if (!email) {

                message.textContent =
                    "Please enter your email.";

                message.className =
                    "message error";

                return;
            }

            if (!password) {

                message.textContent =
                    "Please enter your password.";

                message.className =
                    "message error";

                return;
            }

            button.disabled = true;

            button.textContent =
                "Signing in...";

            message.textContent =
                "";

            try {

                const {
                    response,
                    data
                } = await apiRequest(
                    "/api/auth/login",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );

                console.log(
                    "LOGIN RESPONSE:",
                    data
                );

                if (response.ok) {

                    if (data.token) {

                        localStorage.setItem(
                            "token",
                            data.token
                        );
                    }

                    if (data.user) {

                        localStorage.setItem(
                            "user",
                            JSON.stringify(
                                data.user
                            )
                        );
                    }

                    message.textContent =
                        data.message ||
                        "Login successful.";

                    message.className =
                        "message success";

                    setTimeout(
                        function () {

                            window.location.href =
                                "/pages/dashboard.html";

                        },
                        700
                    );

                } else {

                    message.textContent =
                        data.message ||
                        "Invalid email or password.";

                    message.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Sign in";
                }

            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                message.textContent =
                    "Unable to connect to the server.";

                message.className =
                    "message error";

                button.disabled =
                    false;

                button.textContent =
                    "Sign in";
            }
        }
    );
}


// ========================================
// REGISTER
// ========================================

function setupRegisterForm() {

    const form =
        document.getElementById(
            "registerForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const formData =
                new FormData(form);

            const data =
                Object.fromEntries(
                    formData.entries()
                );

            const password =
                data.password || "";

            const confirmPassword =
                data.confirmPassword ||
                data.confirm_password ||
                "";

            const message =
                document.getElementById(
                    "registerMessage"
                );

            const button =
                form.querySelector(
                    ".submit"
                );

            if (
                password !==
                confirmPassword
            ) {

                message.textContent =
                    "Passwords do not match.";

                message.className =
                    "message error";

                return;
            }

            if (password.length < 8) {

                message.textContent =
                    "Password must be at least 8 characters.";

                message.className =
                    "message error";

                return;
            }

            button.disabled = true;

            button.textContent =
                "Creating account...";

            try {

                const {
                    response,
                    data: result
                } = await apiRequest(
                    "/api/auth/register",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                data
                            )
                    }
                );

                console.log(
                    "REGISTER RESPONSE:",
                    result
                );

                if (response.ok) {

                    message.textContent =
                        result.message ||
                        "Registration successful.";

                    message.className =
                        "message success";

                    setTimeout(
                        function () {

                            window.location.href =
                                "/login.html";

                        },
                        1000
                    );

                } else {

                    message.textContent =
                        result.message ||
                        "Registration failed.";

                    message.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Create account";
                }

            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );

                message.textContent =
                    "Unable to connect to the server.";

                message.className =
                    "message error";

                button.disabled =
                    false;

                button.textContent =
                    "Create account";
            }
        }
    );
}


// ========================================
// FORGOT PASSWORD
// ========================================

function setupForgotPasswordForm() {

    const form =
        document.getElementById(
            "forgotPasswordForm"
        );

    if (!form) {
        return;
    }

    const emailInput =
        document.getElementById(
            "email"
        );

    const status =
        document.getElementById(
            "status"
        );

    const button =
        document.getElementById(
            "sendButton"
        );

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            if (!email) {

                status.textContent =
                    "Please enter your email address.";

                status.className =
                    "message error";

                return;
            }

            button.disabled = true;

            button.textContent =
                "Sending...";

            status.textContent =
                "Sending reset code...";

            status.className =
                "message";

            try {

                const {
                    response,
                    data
                } = await apiRequest(
                    "/api/auth/forgot-password",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                email
                            })
                    }
                );

                console.log(
                    "FORGOT PASSWORD RESPONSE:",
                    data
                );

                if (response.ok) {

                    sessionStorage.setItem(
                        "resetEmail",
                        email
                    );

                    status.textContent =
                        data.message ||
                        "Reset code sent successfully.";

                    status.className =
                        "message success";

                    setTimeout(
                        function () {

                            window.location.href =
                                "/reset-password.html";

                        },
                        800
                    );

                } else {

                    status.textContent =
                        data.message ||
                        "Unable to send reset code.";

                    status.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Send reset code";
                }

            } catch (error) {

                console.error(
                    "FORGOT PASSWORD ERROR:",
                    error
                );

                status.textContent =
                    "Cannot connect to the server.";

                status.className =
                    "message error";

                button.disabled =
                    false;

                button.textContent =
                    "Send reset code";
            }
        }
    );
}


// ========================================
// RESET PASSWORD PAGE
// ========================================

function setupResetPasswordPage() {

    const otpForm =
        document.getElementById(
            "verifyResetOtpForm"
        );

    const passwordForm =
        document.getElementById(
            "setNewPasswordForm"
        );

    if (
        !otpForm &&
        !passwordForm
    ) {
        return;
    }

    const email =
        sessionStorage.getItem(
            "resetEmail"
        );

    const emailDisplay =
        document.getElementById(
            "resetEmailDisplay"
        );

    if (email) {

        emailDisplay.textContent =
            email;
    }

    // ========================================
    // VERIFY OTP
    // ========================================

    if (otpForm) {

        const otpInput =
            document.getElementById(
                "resetOtp"
            );

        const message =
            document.getElementById(
                "otpStepMessage"
            );

        const button =
            document.getElementById(
                "verifyOtpButton"
            );

        otpForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const otp =
                    otpInput.value
                        .trim();

                if (!email) {

                    message.textContent =
                        "Your reset session has expired. Please request a new code.";

                    message.className =
                        "message error";

                    return;
                }

                if (!/^\d{6}$/.test(otp)) {

                    message.textContent =
                        "Please enter the 6-digit code.";

                    message.className =
                        "message error";

                    return;
                }

                button.disabled = true;

                button.textContent =
                    "Verifying...";

                message.textContent =
                    "Verifying your code...";

                message.className =
                    "message";

                try {

                    const {
                        response,
                        data
                    } = await apiRequest(
                        "/api/auth/verify-reset-otp",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    email,
                                    otp
                                })
                        }
                    );

                    console.log(
                        "VERIFY RESET OTP RESPONSE:",
                        data
                    );

                    if (response.ok) {

                        if (
                            data.resetToken
                        ) {

                            sessionStorage.setItem(
                                "resetToken",
                                data.resetToken
                            );
                        }

                        message.textContent =
                            data.message ||
                            "Code verified.";

                        message.className =
                            "message success";

                        document.getElementById(
                            "otpStep"
                        ).style.display =
                            "none";

                        document.getElementById(
                            "newPasswordStep"
                        ).style.display =
                            "block";

                    } else {

                        message.textContent =
                            data.message ||
                            "Invalid or expired code.";

                        message.className =
                            "message error";

                        button.disabled =
                            false;

                        button.textContent =
                            "Verify code";
                    }

                } catch (error) {

                    console.error(
                        "VERIFY RESET OTP ERROR:",
                        error
                    );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Verify code";
                }
            }
        );
    }


    // ========================================
    // RESEND OTP
    // ========================================

    const resendButton =
        document.getElementById(
            "resendResetOtpBtn"
        );

    if (resendButton) {

        resendButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                if (!email) {

                    return;
                }

                resendButton.textContent =
                    "Sending...";

                try {

                    const {
                        response,
                        data
                    } = await apiRequest(
                        "/api/auth/forgot-password",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    email
                                })
                        }
                    );

                    if (response.ok) {

                        const message =
                            document.getElementById(
                                "otpStepMessage"
                            );

                        message.textContent =
                            data.message ||
                            "A new reset code has been sent.";

                        message.className =
                            "message success";

                    } else {

                        const message =
                            document.getElementById(
                                "otpStepMessage"
                            );

                        message.textContent =
                            data.message ||
                            "Unable to resend code.";

                        message.className =
                            "message error";
                    }

                } catch (error) {

                    console.error(
                        "RESEND RESET OTP ERROR:",
                        error
                    );

                } finally {

                    resendButton.textContent =
                        "Resend code";
                }
            }
        );
    }


    // ========================================
    // SET NEW PASSWORD
    // ========================================

    if (passwordForm) {

        const newPassword =
            document.getElementById(
                "newPassword"
            );

        const confirmPassword =
            document.getElementById(
                "confirmNewPassword"
            );

        const message =
            document.getElementById(
                "newPasswordMessage"
            );

        const button =
            document.getElementById(
                "resetPasswordButton"
            );

        passwordForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const password =
                    newPassword.value;

                const confirm =
                    confirmPassword.value;

                const resetToken =
                    sessionStorage.getItem(
                        "resetToken"
                    );

                if (!email) {

                    message.textContent =
                        "Your reset session has expired.";

                    message.className =
                        "message error";

                    return;
                }

                if (!resetToken) {

                    message.textContent =
                        "Please verify your reset code first.";

                    message.className =
                        "message error";

                    return;
                }

                if (password.length < 8) {

                    message.textContent =
                        "Password must be at least 8 characters.";

                    message.className =
                        "message error";

                    return;
                }

                if (
                    password !==
                    confirm
                ) {

                    message.textContent =
                        "Passwords do not match.";

                    message.className =
                        "message error";

                    return;
                }

                button.disabled = true;

                button.textContent =
                    "Resetting...";

                try {

                    const {
                        response,
                        data
                    } = await apiRequest(
                        "/api/auth/reset-password",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    email,
                                    resetToken,
                                    newPassword:
                                        password
                                })
                        }
                    );

                    console.log(
                        "RESET PASSWORD RESPONSE:",
                        data
                    );

                    if (response.ok) {

                        message.textContent =
                            data.message ||
                            "Password reset successfully.";

                        message.className =
                            "message success";

                        sessionStorage.removeItem(
                            "resetEmail"
                        );

                        sessionStorage.removeItem(
                            "resetToken"
                        );

                        setTimeout(
                            function () {

                                window.location.href =
                                    "/login.html";

                            },
                            1200
                        );

                    } else {

                        message.textContent =
                            data.message ||
                            "Unable to reset password.";

                        message.className =
                            "message error";

                        button.disabled =
                            false;

                        button.textContent =
                            "Reset password";
                    }

                } catch (error) {

                    console.error(
                        "RESET PASSWORD ERROR:",
                        error
                    );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Reset password";
                }
            }
        );
    }
}


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupPasswordToggles();

        setupLoginForm();

        setupRegisterForm();

        setupForgotPasswordForm();

        setupResetPasswordPage();
    }
);