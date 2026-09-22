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

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let data;

        try {
            data = await response.json();
        } catch {
            data = {
                success: false,
                message: "Invalid server response."
            };
        }

        return {
            response,
            data
        };

    } catch (error) {
        console.error(`API REQUEST ERROR: ${endpoint}`, error);
        throw error;
    }
}


// ========================================
// NAVIGATION HELPERS
// ========================================

function goToLogin() {
    window.location.href = "/login.html";
}

function goToRegister() {
    window.location.href = "/register.html";
}

function goToVerifyEmail() {
    window.location.href = "/verify-email.html";
}

function goToResetPassword() {
    window.location.href = "/reset-password.html";
}

function goToDashboard() {
    window.location.href = "/pages/dashboard.html";
}


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

function setupPasswordToggles() {
    const toggleButtons =
        document.querySelectorAll(".toggle-password");

    toggleButtons.forEach((button) => {
        if (
            button.dataset.passwordToggleInitialized ===
            "true"
        ) {
            return;
        }

        button.dataset.passwordToggleInitialized = "true";

        button.addEventListener("click", () => {
            const wrapper =
                button.closest(".password-wrap");

            if (!wrapper) {
                console.error("Password wrapper not found.");
                return;
            }

            const input =
                wrapper.querySelector("input");

            if (!input) {
                console.error("Password input not found.");
                return;
            }

            if (input.type === "password") {
                input.type = "text";

                button.textContent = "Hide";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {
                input.type = "password";

                button.textContent = "Show";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }
        });
    });
}


// ========================================
// PASSWORD STRENGTH
// ========================================

function setupPasswordStrength() {
    const passwordInput =
        document.getElementById("password");

    if (!passwordInput) {
        return;
    }

    const bars =
        document.querySelectorAll(".strength-bar");

    const lengthHint =
        document.getElementById("hint-length");

    const uppercaseHint =
        document.getElementById("hint-uppercase");

    const numberHint =
        document.getElementById("hint-number");

    const specialHint =
        document.getElementById("hint-special");

    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;

        const hasLength =
            password.length >= 8;

        const hasUppercase =
            /[A-Z]/.test(password);

        const hasNumber =
            /[0-9]/.test(password);

        const hasSpecial =
            /[^A-Za-z0-9]/.test(password);

        const requirements = [
            hasLength,
            hasUppercase,
            hasNumber,
            hasSpecial
        ];


        // ========================================
        // HINTS
        // ========================================

        if (lengthHint) {
            lengthHint.classList.toggle(
                "valid",
                hasLength
            );
        }

        if (uppercaseHint) {
            uppercaseHint.classList.toggle(
                "valid",
                hasUppercase
            );
        }

        if (numberHint) {
            numberHint.classList.toggle(
                "valid",
                hasNumber
            );
        }

        if (specialHint) {
            specialHint.classList.toggle(
                "valid",
                hasSpecial
            );
        }


        // ========================================
        // STRENGTH BARS
        // ========================================

        let strength = 0;

        requirements.forEach((valid) => {
            if (valid) {
                strength++;
            }
        });

        bars.forEach((bar, index) => {
            bar.classList.toggle(
                "active",
                index < strength
            );
        });
    });
}


// ========================================
// LOGIN
// ========================================

function setupLoginForm() {
    const form =
        document.getElementById("loginForm");

    if (!form) {
        return;
    }

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const message =
        document.getElementById("loginMessage");

    const button =
        form.querySelector(".submit");


    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email =
            emailInput
                ? emailInput.value.trim().toLowerCase()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";


        // ========================================
        // VALIDATION
        // ========================================

        if (!email) {
            if (message) {
                message.textContent =
                    "Please enter your email.";

                message.className =
                    "message error";
            }

            emailInput?.focus();
            return;
        }

        if (!password) {
            if (message) {
                message.textContent =
                    "Please enter your password.";

                message.className =
                    "message error";
            }

            passwordInput?.focus();
            return;
        }


        // ========================================
        // DISABLE BUTTON
        // ========================================

        if (button) {
            button.disabled = true;
            button.textContent = "Signing in...";
        }

        if (message) {
            message.textContent = "";
            message.className = "message";
        }


        // ========================================
        // LOGIN REQUEST
        // ========================================

        try {
            const {
                response,
                data
            } = await apiRequest(
                "/api/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            console.log("LOGIN RESPONSE:", data);


            // ========================================
            // LOGIN SUCCESS
            // ========================================

            if (response.ok && data.success !== false) {

                if (data.token) {
                    localStorage.setItem(
                        "token",
                        data.token
                    );
                }

                if (data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

                if (message) {
                    message.textContent =
                        data.message ||
                        "Login successful.";

                    message.className =
                        "message success";
                }

                // IMPORTANT:
                // Actual dashboard file:
                // /pages/dashboard.html

                setTimeout(() => {
                    goToDashboard();
                }, 700);

                return;
            }


            // ========================================
            // LOGIN FAILED
            // ========================================

            if (message) {
                message.textContent =
                    data.message ||
                    "Invalid email or password.";

                message.className =
                    "message error";
            }

            if (button) {
                button.disabled = false;
                button.textContent = "Sign in";
            }

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            if (message) {
                message.textContent =
                    "Unable to connect to the server.";

                message.className =
                    "message error";
            }

            if (button) {
                button.disabled = false;
                button.textContent = "Sign in";
            }
        }
    });
}


// ========================================
// REGISTER
// ========================================

function setupRegisterForm() {
    const form =
        document.getElementById("registerForm");

    if (!form) {
        return;
    }


    // ========================================
    // INPUTS
    // ========================================

    const firstNameInput =
        document.getElementById("firstName");

    const lastNameInput =
        document.getElementById("lastName");

    const emailInput =
        document.getElementById("email");

    const phoneInput =
        document.getElementById("phone");

    const passwordInput =
        document.getElementById("password");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const termsCheckbox =
        document.getElementById("termsCheckbox");

    const message =
        document.getElementById("registerMessage");

    const button =
        document.getElementById("registerButton");


    // ========================================
    // SUBMIT
    // ========================================

    form.addEventListener("submit", async (event) => {
        event.preventDefault();


        // ========================================
        // GET VALUES
        // ========================================

        const firstName =
            firstNameInput
                ? firstNameInput.value.trim()
                : "";

        const lastName =
            lastNameInput
                ? lastNameInput.value.trim()
                : "";

        const email =
            emailInput
                ? emailInput.value.trim().toLowerCase()
                : "";

        const phone =
            phoneInput
                ? phoneInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";

        const confirmPassword =
            confirmPasswordInput
                ? confirmPasswordInput.value
                : "";


        // ========================================
        // VALIDATE FIRST NAME
        // ========================================

        if (!firstName) {
            message.textContent =
                "Please enter your first name.";

            message.className =
                "message error";

            firstNameInput?.focus();
            return;
        }


        // ========================================
        // VALIDATE LAST NAME
        // ========================================

        if (!lastName) {
            message.textContent =
                "Please enter your last name.";

            message.className =
                "message error";

            lastNameInput?.focus();
            return;
        }


        // ========================================
        // VALIDATE EMAIL
        // ========================================

        if (!email) {
            message.textContent =
                "Please enter your email.";

            message.className =
                "message error";

            emailInput?.focus();
            return;
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            message.textContent =
                "Please enter a valid email address.";

            message.className =
                "message error";

            emailInput?.focus();
            return;
        }


        // ========================================
        // VALIDATE PASSWORD
        // ========================================

        if (!password) {
            message.textContent =
                "Please enter your password.";

            message.className =
                "message error";

            passwordInput?.focus();
            return;
        }

        if (password.length < 8) {
            message.textContent =
                "Password must be at least 8 characters.";

            message.className =
                "message error";

            passwordInput?.focus();
            return;
        }

        if (!/[A-Z]/.test(password)) {
            message.textContent =
                "Password must contain at least one uppercase letter.";

            message.className =
                "message error";

            passwordInput?.focus();
            return;
        }

        if (!/[0-9]/.test(password)) {
            message.textContent =
                "Password must contain at least one number.";

            message.className =
                "message error";

            passwordInput?.focus();
            return;
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            message.textContent =
                "Password must contain at least one special character.";

            message.className =
                "message error";

            passwordInput?.focus();
            return;
        }


        // ========================================
        // CONFIRM PASSWORD
        // ========================================

        if (password !== confirmPassword) {
            message.textContent =
                "Passwords do not match.";

            message.className =
                "message error";

            confirmPasswordInput?.focus();
            return;
        }


        // ========================================
        // TERMS
        // ========================================

        if (
            termsCheckbox &&
            !termsCheckbox.checked
        ) {
            message.textContent =
                "Please agree to the Terms of Service and Privacy Policy.";

            message.className =
                "message error";

            return;
        }


        // ========================================
        // REGISTRATION DATA
        // ========================================

        const registrationData = {
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            phone: phone || null
        };


        console.log(
            "REGISTER DATA:",
            registrationData
        );

        console.log(
            "API URL:",
            API_URL
        );


        // ========================================
        // DISABLE BUTTON
        // ========================================

        if (button) {
            button.disabled = true;
            button.textContent =
                "Creating account...";
        }

        message.textContent =
            "Creating your account...";

        message.className =
            "message";


        // ========================================
        // SEND REGISTER REQUEST
        // ========================================

        try {
            const {
                response,
                data: result
            } = await apiRequest(
                "/api/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify(
                        registrationData
                    )
                }
            );

            console.log(
                "REGISTER RESPONSE:",
                result
            );


            // ========================================
            // SUCCESS
            // ========================================

            if (
                response.ok &&
                result.success !== false
            ) {
                sessionStorage.setItem(
                    "registrationEmail",
                    email
                );

                message.textContent =
                    result.message ||
                    "Registration successful. Please check your email for the OTP.";

                message.className =
                    "message success";

                setTimeout(() => {
                    goToVerifyEmail();
                }, 1000);

                return;
            }


            // ========================================
            // REGISTER FAILED
            // ========================================

            message.textContent =
                result.message ||
                "Registration failed.";

            message.className =
                "message error";

            if (button) {
                button.disabled = false;
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

            if (button) {
                button.disabled = false;
                button.textContent =
                    "Create account";
            }
        }
    });
}


// ========================================
// REGISTRATION OTP
// ========================================

function setupRegistrationOTP() {
    const form =
        document.getElementById("otpForm") ||
        document.getElementById("verifyOtpForm");

    if (!form) {
        return;
    }

    const otpInput =
        document.getElementById("otp") ||
        document.getElementById("verificationCode") ||
        document.getElementById("verifyOtp");

    const emailInput =
        document.getElementById("email");

    const message =
        document.getElementById("message") ||
        document.getElementById("otpMessage") ||
        document.getElementById("verifyMessage");

    const button =
        form.querySelector(".submit") ||
        document.getElementById("verifyOtpButton") ||
        document.getElementById("verifyButton");

    const resendButton =
        document.getElementById("resendOtpBtn") ||
        document.getElementById("resendOTP") ||
        document.getElementById("resendOtpButton") ||
        document.getElementById("resendButton");

    const timerDisplay =
        document.getElementById("timer");

    const emailDisplay =
        document.getElementById("emailDisplay");

    const savedEmail =
        sessionStorage.getItem(
            "registrationEmail"
        );


    // ========================================
    // SHOW EMAIL
    // ========================================

    if (emailDisplay) {
        emailDisplay.textContent =
            savedEmail || "your email";
    }


    // ========================================
    // COUNTDOWN
    // ========================================

    const OTP_DURATION_SECONDS = 3 * 60;

    let remainingSeconds =
        OTP_DURATION_SECONDS;

    let countdownInterval = null;

    function formatTime(totalSeconds) {
        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        return (
            minutes +
            ":" +
            String(seconds).padStart(2, "0")
        );
    }

    function startCountdown() {
        remainingSeconds =
            OTP_DURATION_SECONDS;

        if (resendButton) {
            resendButton.disabled = true;
        }

        if (timerDisplay) {
            timerDisplay.textContent =
                "Code expires in " +
                formatTime(remainingSeconds);

            timerDisplay.classList.remove(
                "expired"
            );
        }

        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        countdownInterval = setInterval(() => {
            remainingSeconds--;

            if (remainingSeconds <= 0) {
                clearInterval(
                    countdownInterval
                );

                countdownInterval = null;

                if (timerDisplay) {
                    timerDisplay.textContent =
                        "Code expired";

                    timerDisplay.classList.add(
                        "expired"
                    );
                }

                if (resendButton) {
                    resendButton.disabled =
                        false;
                }

                return;
            }

            if (timerDisplay) {
                timerDisplay.textContent =
                    "Code expires in " +
                    formatTime(
                        remainingSeconds
                    );
            }
        }, 1000);
    }


    if (savedEmail) {
        startCountdown();
    }


    // ========================================
    // VERIFY OTP
    // ========================================

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email =
            savedEmail ||
            (
                emailInput
                    ? emailInput.value
                        .trim()
                        .toLowerCase()
                    : ""
            );

        const otp =
            otpInput
                ? otpInput.value.trim()
                : "";

        if (!email) {
            message.textContent =
                "Registration session expired. Please register again.";

            message.className =
                "message error";

            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            message.textContent =
                "Please enter the 6-digit verification code.";

            message.className =
                "message error";

            return;
        }

        button.disabled = true;
        button.textContent = "Verifying...";

        message.textContent =
            "Verifying your code...";

        message.className =
            "message";


        try {
            const {
                response,
                data
            } = await apiRequest(
                "/api/auth/verify-otp",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        otp
                    })
                }
            );

            console.log(
                "VERIFY OTP RESPONSE:",
                data
            );

            if (response.ok) {
                if (countdownInterval) {
                    clearInterval(
                        countdownInterval
                    );
                }

                message.textContent =
                    data.message ||
                    "Account created successfully.";

                message.className =
                    "message success";

                sessionStorage.removeItem(
                    "registrationEmail"
                );

                setTimeout(() => {
                    goToLogin();
                }, 1200);

                return;
            }

            message.textContent =
                data.message ||
                "Invalid verification code.";

            message.className =
                "message error";

            button.disabled = false;
            button.textContent =
                "Verify code";

        } catch (error) {
            console.error(
                "VERIFY OTP ERROR:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";

            message.className =
                "message error";

            button.disabled = false;
            button.textContent =
                "Verify code";
        }
    });


    // ========================================
    // RESEND OTP
    // ========================================

    if (resendButton) {
        resendButton.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();

                if (!savedEmail) {
                    message.textContent =
                        "Registration session expired. Please register again.";

                    message.className =
                        "message error";

                    return;
                }

                resendButton.disabled = true;
                resendButton.textContent =
                    "Sending...";

                try {
                    const {
                        response,
                        data
                    } = await apiRequest(
                        "/api/auth/resend-otp",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                email: savedEmail
                            })
                        }
                    );

                    if (response.ok) {
                        message.textContent =
                            data.message ||
                            "A new OTP has been sent.";

                        message.className =
                            "message success";

                        startCountdown();

                    } else {
                        message.textContent =
                            data.message ||
                            "Unable to resend OTP.";

                        message.className =
                            "message error";

                        resendButton.disabled =
                            false;
                    }

                } catch (error) {
                    console.error(
                        "RESEND OTP ERROR:",
                        error
                    );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                    resendButton.disabled =
                        false;

                } finally {
                    resendButton.textContent =
                        "Resend code";
                }
            }
        );
    }
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
        document.getElementById("email");

    const status =
        document.getElementById("status");

    const button =
        document.getElementById("sendButton");


    form.addEventListener(
        "submit",
        async (event) => {
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

                emailInput.focus();

                return;
            }

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                status.textContent =
                    "Please enter a valid email address.";

                status.className =
                    "message error";

                emailInput.focus();

                return;
            }

            button.disabled = true;
            button.textContent = "Sending...";

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
                        body: JSON.stringify({
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

                    setTimeout(() => {
                        goToResetPassword();
                    }, 800);

                    return;
                }

                status.textContent =
                    data.message ||
                    "Unable to send reset code.";

                status.className =
                    "message error";

                button.disabled = false;
                button.textContent =
                    "Send reset code";

            } catch (error) {
                console.error(
                    "FORGOT PASSWORD ERROR:",
                    error
                );

                status.textContent =
                    "Cannot connect to the server.";

                status.className =
                    "message error";

                button.disabled = false;
                button.textContent =
                    "Send reset code";
            }
        }
    );
}


// ========================================
// RESET PASSWORD
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

    if (!otpForm && !passwordForm) {
        return;
    }

    const email =
        sessionStorage.getItem("resetEmail");

    const emailDisplay =
        document.getElementById(
            "resetEmailDisplay"
        );

    if (email && emailDisplay) {
        emailDisplay.textContent = email;
    }


    // ========================================
    // VERIFY RESET OTP
    // ========================================

    if (otpForm) {
        const otpInput =
            document.getElementById("resetOtp");

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
            async (event) => {
                event.preventDefault();

                const otp =
                    otpInput.value.trim();

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
                            body: JSON.stringify({
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
                        if (data.resetToken) {
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

                        const otpStep =
                            document.getElementById(
                                "otpStep"
                            );

                        const newPasswordStep =
                            document.getElementById(
                                "newPasswordStep"
                            );

                        if (otpStep) {
                            otpStep.style.display =
                                "none";
                        }

                        if (newPasswordStep) {
                            newPasswordStep.style.display =
                                "block";
                        }

                        return;
                    }

                    message.textContent =
                        data.message ||
                        "Invalid or expired code.";

                    message.className =
                        "message error";

                    button.disabled = false;
                    button.textContent =
                        "Verify code";

                } catch (error) {
                    console.error(
                        "VERIFY RESET OTP ERROR:",
                        error
                    );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                    button.disabled = false;
                    button.textContent =
                        "Verify code";
                }
            }
        );
    }


    // ========================================
    // RESEND RESET OTP
    // ========================================

    const resendButton =
        document.getElementById(
            "resendResetOtpBtn"
        );

    if (resendButton) {
        resendButton.addEventListener(
            "click",
            async (event) => {
                event.preventDefault();

                if (!email) {
                    return;
                }

                resendButton.disabled = true;
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
                            body: JSON.stringify({
                                email
                            })
                        }
                    );

                    const message =
                        document.getElementById(
                            "otpStepMessage"
                        );

                    if (response.ok) {
                        message.textContent =
                            data.message ||
                            "A new reset code has been sent.";

                        message.className =
                            "message success";

                    } else {
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

                    const message =
                        document.getElementById(
                            "otpStepMessage"
                        );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                } finally {
                    resendButton.disabled = false;
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
            async (event) => {
                event.preventDefault();

                const password =
                    newPassword.value;

                const confirm =
                    confirmPassword.value;

                const resetToken =
                    sessionStorage.getItem(
                        "resetToken"
                    );


                // ========================================
                // VALIDATION
                // ========================================

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

                if (!/[A-Z]/.test(password)) {
                    message.textContent =
                        "Password must contain at least one uppercase letter.";

                    message.className =
                        "message error";

                    return;
                }

                if (!/[0-9]/.test(password)) {
                    message.textContent =
                        "Password must contain at least one number.";

                    message.className =
                        "message error";

                    return;
                }

                if (!/[^A-Za-z0-9]/.test(password)) {
                    message.textContent =
                        "Password must contain at least one special character.";

                    message.className =
                        "message error";

                    return;
                }

                if (password !== confirm) {
                    message.textContent =
                        "Passwords do not match.";

                    message.className =
                        "message error";

                    return;
                }


                // ========================================
                // DISABLE BUTTON
                // ========================================

                button.disabled = true;
                button.textContent =
                    "Resetting...";

                message.textContent =
                    "Resetting your password...";

                message.className =
                    "message";


                // ========================================
                // RESET PASSWORD
                // ========================================

                try {
                    const {
                        response,
                        data
                    } = await apiRequest(
                        "/api/auth/reset-password",
                        {
                            method: "POST",
                            body: JSON.stringify({
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

                        setTimeout(() => {
                            goToLogin();
                        }, 1200);

                        return;
                    }

                    message.textContent =
                        data.message ||
                        "Unable to reset password.";

                    message.className =
                        "message error";

                    button.disabled = false;
                    button.textContent =
                        "Reset password";

                } catch (error) {
                    console.error(
                        "RESET PASSWORD ERROR:",
                        error
                    );

                    message.textContent =
                        "Unable to connect to the server.";

                    message.className =
                        "message error";

                    button.disabled = false;
                    button.textContent =
                        "Reset password";
                }
            }
        );
    }
}


// ========================================
// TERMS & PRIVACY MODALS
// ========================================

function setupRegistrationModals() {
    const termsLink =
        document.getElementById("termsLink");

    const privacyLink =
        document.getElementById("privacyLink");

    const termsModal =
        document.getElementById("termsModal");

    const privacyModal =
        document.getElementById("privacyModal");


    // ========================================
    // TERMS
    // ========================================

    if (termsLink && termsModal) {
        termsLink.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                termsModal.classList.add("active");
                termsModal.style.display = "flex";
            }
        );
    }

    const closeModal =
        document.getElementById("closeModal");

    const declineBtn =
        document.getElementById("declineBtn");

    const acceptBtn =
        document.getElementById("acceptBtn");


    if (closeModal) {
        closeModal.addEventListener(
            "click",
            () => {
                if (termsModal) {
                    termsModal.classList.remove(
                        "active"
                    );

                    termsModal.style.display =
                        "none";
                }
            }
        );
    }

    if (declineBtn) {
        declineBtn.addEventListener(
            "click",
            () => {
                if (termsModal) {
                    termsModal.classList.remove(
                        "active"
                    );

                    termsModal.style.display =
                        "none";
                }
            }
        );
    }

    if (acceptBtn) {
        acceptBtn.addEventListener(
            "click",
            () => {
                const checkbox =
                    document.getElementById(
                        "termsCheckbox"
                    );

                if (checkbox) {
                    checkbox.checked = true;
                }

                if (termsModal) {
                    termsModal.classList.remove(
                        "active"
                    );

                    termsModal.style.display =
                        "none";
                }
            }
        );
    }


    // ========================================
    // PRIVACY
    // ========================================

    if (privacyLink && privacyModal) {
        privacyLink.addEventListener(
            "click",
            (event) => {
                event.preventDefault();

                privacyModal.classList.add("active");
                privacyModal.style.display = "flex";
            }
        );
    }

    const closePrivacyModal =
        document.getElementById(
            "closePrivacyModal"
        );

    const declinePrivacyBtn =
        document.getElementById(
            "declinePrivacyBtn"
        );

    const acceptPrivacyBtn =
        document.getElementById(
            "acceptPrivacyBtn"
        );


    if (closePrivacyModal) {
        closePrivacyModal.addEventListener(
            "click",
            () => {
                if (privacyModal) {
                    privacyModal.classList.remove(
                        "active"
                    );

                    privacyModal.style.display =
                        "none";
                }
            }
        );
    }

    if (declinePrivacyBtn) {
        declinePrivacyBtn.addEventListener(
            "click",
            () => {
                if (privacyModal) {
                    privacyModal.classList.remove(
                        "active"
                    );

                    privacyModal.style.display =
                        "none";
                }
            }
        );
    }

    if (acceptPrivacyBtn) {
        acceptPrivacyBtn.addEventListener(
            "click",
            () => {
                const checkbox =
                    document.getElementById(
                        "termsCheckbox"
                    );

                if (checkbox) {
                    checkbox.checked = true;
                }

                if (privacyModal) {
                    privacyModal.classList.remove(
                        "active"
                    );

                    privacyModal.style.display =
                        "none";
                }
            }
        );
    }


    // ========================================
    // CLICK OUTSIDE MODAL
    // ========================================

    if (termsModal) {
        termsModal.addEventListener(
            "click",
            (event) => {
                if (event.target === termsModal) {
                    termsModal.classList.remove(
                        "active"
                    );

                    termsModal.style.display =
                        "none";
                }
            }
        );
    }

    if (privacyModal) {
        privacyModal.addEventListener(
            "click",
            (event) => {
                if (
                    event.target === privacyModal
                ) {
                    privacyModal.classList.remove(
                        "active"
                    );

                    privacyModal.style.display =
                        "none";
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
    () => {
        setupPasswordToggles();
        setupPasswordStrength();
        setupLoginForm();
        setupRegisterForm();
        setupRegistrationOTP();
        setupForgotPasswordForm();
        setupResetPasswordPage();
        setupRegistrationModals();
    }
);