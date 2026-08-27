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
// PASSWORD STRENGTH
// ========================================

function setupPasswordStrength() {

    const passwordInput =
        document.getElementById(
            "password"
        );

    if (!passwordInput) {
        return;
    }

    const bars =
        document.querySelectorAll(
            ".strength-bar"
        );

    const lengthHint =
        document.getElementById(
            "hint-length"
        );

    const uppercaseHint =
        document.getElementById(
            "hint-uppercase"
        );

    const numberHint =
        document.getElementById(
            "hint-number"
        );

    const specialHint =
        document.getElementById(
            "hint-special"
        );


    passwordInput.addEventListener(
        "input",
        function () {

            const password =
                passwordInput.value;

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

            requirements.forEach(
                function (valid) {

                    if (valid) {
                        strength++;
                    }

                }
            );


            bars.forEach(
                function (bar, index) {

                    bar.classList.toggle(
                        "active",
                        index < strength
                    );

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


            // ========================================
            // VALIDATION
            // ========================================

            if (!email) {

                message.textContent =
                    "Please enter your email.";

                message.className =
                    "message error";

                emailInput.focus();

                return;
            }


            if (!password) {

                message.textContent =
                    "Please enter your password.";

                message.className =
                    "message error";

                passwordInput.focus();

                return;
            }


            // ========================================
            // DISABLE BUTTON
            // ========================================

            button.disabled = true;

            button.textContent =
                "Signing in...";

            message.textContent = "";

            message.className =
                "message";


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


                // ========================================
                // LOGIN SUCCESS
                // ========================================

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


    // ========================================
    // INPUTS
    // ========================================

    const firstNameInput =
        document.getElementById(
            "firstName"
        );

    const lastNameInput =
        document.getElementById(
            "lastName"
        );

    const emailInput =
        document.getElementById(
            "email"
        );

    const phoneInput =
        document.getElementById(
            "phone"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const confirmPasswordInput =
        document.getElementById(
            "confirmPassword"
        );

    const termsCheckbox =
        document.getElementById(
            "termsCheckbox"
        );

    const message =
        document.getElementById(
            "registerMessage"
        );

    const button =
        document.getElementById(
            "registerButton"
        );


    // ========================================
    // SUBMIT
    // ========================================

    form.addEventListener(
        "submit",
        async function (event) {

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
                    ? emailInput.value
                        .trim()
                        .toLowerCase()
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

                if (firstNameInput) {
                    firstNameInput.focus();
                }

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

                if (lastNameInput) {
                    lastNameInput.focus();
                }

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

                if (emailInput) {
                    emailInput.focus();
                }

                return;
            }


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                message.textContent =
                    "Please enter a valid email address.";

                message.className =
                    "message error";

                if (emailInput) {
                    emailInput.focus();
                }

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

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            if (password.length < 8) {

                message.textContent =
                    "Password must be at least 8 characters.";

                message.className =
                    "message error";

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            if (!/[A-Z]/.test(password)) {

                message.textContent =
                    "Password must contain at least one uppercase letter.";

                message.className =
                    "message error";

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            if (!/[0-9]/.test(password)) {

                message.textContent =
                    "Password must contain at least one number.";

                message.className =
                    "message error";

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            if (!/[^A-Za-z0-9]/.test(password)) {

                message.textContent =
                    "Password must contain at least one special character.";

                message.className =
                    "message error";

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            // ========================================
            // CONFIRM PASSWORD
            // ========================================

            if (
                password !==
                confirmPassword
            ) {

                message.textContent =
                    "Passwords do not match.";

                message.className =
                    "message error";

                if (confirmPasswordInput) {
                    confirmPasswordInput.focus();
                }

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
            // IMPORTANT:
            // MATCHES BACKEND
            // ========================================

            const registrationData = {

                first_name:
                    firstName,

                last_name:
                    lastName,

                email:
                    email,

                password:
                    password,

                phone:
                    phone || null

            };


            // ========================================
            // DEBUG
            // ========================================

            console.log(
                "================================"
            );

            console.log(
                "REGISTER DATA BEING SENT:"
            );

            console.log(
                registrationData
            );

            console.log(
                JSON.stringify(
                    registrationData,
                    null,
                    2
                )
            );

            console.log(
                "API URL:",
                API_URL
            );

            console.log(
                "================================"
            );


            // ========================================
            // DISABLE BUTTON
            // ========================================

            button.disabled = true;

            button.textContent =
                "Creating account...";

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

                        body:
                            JSON.stringify(
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

                if (response.ok) {

                    /*
                     * Save email for OTP verification.
                     */

                    sessionStorage.setItem(
                        "registrationEmail",
                        email
                    );


                    message.textContent =
                        result.message ||
                        "Registration successful. Please check your email for the OTP.";

                    message.className =
                        "message success";


                    /*
                     * Backend returns:
                     *
                     * requiresVerification: true
                     *
                     * Redirect to OTP page.
                     */

                    setTimeout(
                        function () {

                            /*
                             * Change this filename if
                             * your OTP page has a
                             * different filename.
                             */

                            window.location.href =
                                "/verify-otp.html";

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
// REGISTRATION OTP PAGE
// ========================================

function setupRegistrationOTP() {

    const form =
        document.getElementById(
            "verifyOtpForm"
        );

    if (!form) {
        return;
    }


    const otpInput =
        document.getElementById(
            "otp"
        ) ||
        document.getElementById(
            "verificationCode"
        ) ||
        document.getElementById(
            "verifyOtp"
        );

    const emailInput =
        document.getElementById(
            "email"
        );

    const message =
        document.getElementById(
            "otpMessage"
        ) ||
        document.getElementById(
            "verifyMessage"
        ) ||
        document.getElementById(
            "message"
        );

    const button =
        form.querySelector(
            ".submit"
        ) ||
        document.getElementById(
            "verifyOtpButton"
        );


    const savedEmail =
        sessionStorage.getItem(
            "registrationEmail"
        );


    form.addEventListener(
        "submit",
        async function (event) {

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
                    "/api/auth/verify-otp",
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
                    "VERIFY OTP RESPONSE:",
                    data
                );


                if (response.ok) {

                    message.textContent =
                        data.message ||
                        "Account created successfully.";

                    message.className =
                        "message success";


                    sessionStorage.removeItem(
                        "registrationEmail"
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
                        "Invalid verification code.";

                    message.className =
                        "message error";

                    button.disabled =
                        false;

                    button.textContent =
                        "Verify code";
                }


            } catch (error) {

                console.error(
                    "VERIFY OTP ERROR:",
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


    // ========================================
    // RESEND REGISTRATION OTP
    // ========================================

    const resendButton =
        document.getElementById(
            "resendOtpBtn"
        ) ||
        document.getElementById(
            "resendOTP"
        ) ||
        document.getElementById(
            "resendOtpButton"
        );


    if (resendButton) {

        resendButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                if (!savedEmail) {

                    message.textContent =
                        "Registration session expired. Please register again.";

                    message.className =
                        "message error";

                    return;
                }


                resendButton.disabled =
                    true;

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

                            body:
                                JSON.stringify({
                                    email:
                                        savedEmail
                                })
                        }
                    );


                    if (response.ok) {

                        message.textContent =
                            data.message ||
                            "A new OTP has been sent.";

                        message.className =
                            "message success";

                    } else {

                        message.textContent =
                            data.message ||
                            "Unable to resend OTP.";

                        message.className =
                            "message error";
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


                } finally {

                    resendButton.disabled =
                        false;

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


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                status.textContent =
                    "Please enter a valid email address.";

                status.className =
                    "message error";

                return;
            }


            button.disabled =
                true;

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


    if (
        email &&
        emailDisplay
    ) {

        emailDisplay.textContent =
            email;

    }


    // ========================================
    // VERIFY RESET OTP
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


                button.disabled =
                    true;

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
    // RESEND RESET OTP
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


                resendButton.disabled =
                    true;

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

                    resendButton.disabled =
                        false;

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


                // ========================================
                // DISABLE BUTTON
                // ========================================

                button.disabled =
                    true;

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
// TERMS & PRIVACY MODALS
// ========================================

function setupRegistrationModals() {

    const termsLink =
        document.getElementById(
            "termsLink"
        );

    const privacyLink =
        document.getElementById(
            "privacyLink"
        );

    const termsModal =
        document.getElementById(
            "termsModal"
        );

    const privacyModal =
        document.getElementById(
            "privacyModal"
        );


    // ========================================
    // TERMS
    // ========================================

    if (
        termsLink &&
        termsModal
    ) {

        termsLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                termsModal.classList.add(
                    "active"
                );

                termsModal.style.display =
                    "flex";
            }
        );
    }


    const closeModal =
        document.getElementById(
            "closeModal"
        );

    const declineBtn =
        document.getElementById(
            "declineBtn"
        );

    const acceptBtn =
        document.getElementById(
            "acceptBtn"
        );


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            function () {

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
            function () {

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
            function () {

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

    if (
        privacyLink &&
        privacyModal
    ) {

        privacyLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                privacyModal.classList.add(
                    "active"
                );

                privacyModal.style.display =
                    "flex";
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
            function () {

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
            function () {

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
            function () {

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
            function (event) {

                if (
                    event.target ===
                    termsModal
                ) {

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
            function (event) {

                if (
                    event.target ===
                    privacyModal
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
    function () {

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