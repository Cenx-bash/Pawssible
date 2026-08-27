// ========================================
// PETCARECONNECT AUTHENTICATION
// ========================================


const API_URL =
    "https://retail-prove-refugees-muscles.trycloudflare.com";

// ========================================
// HELPER FUNCTIONS
// ========================================

function showMessage(element, text, type = "error") {
    if (!element) return;

    element.textContent = text;
    element.className = "register-message";

    if (type === "success") {
        element.style.color = "#4b6a4b";
    } else if (type === "loading") {
        element.style.color = "#4b6a4b";
    } else {
        element.style.color = "#b35f5f";
    }
}

function getStoredUser() {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Failed to read stored user:", error);
        return null;
    }
}

// ========================================
// PASSWORD VISIBILITY
// ========================================

document.addEventListener("DOMContentLoaded", function () {
    document
        .querySelectorAll(".toggle-password")
        .forEach((button) => {
            button.addEventListener("click", function (event) {
                event.preventDefault();

                const wrapper =
                    this.closest(".input-wrapper");

                if (!wrapper) return;

                const input =
                    wrapper.querySelector("input");

                const icon =
                    this.querySelector("i");

                if (!input) return;

                if (input.type === "password") {
                    input.type = "text";

                    if (icon) {
                        icon.classList.remove("fa-eye");
                        icon.classList.add("fa-eye-slash");
                    }

                    this.setAttribute(
                        "aria-label",
                        "Hide password"
                    );
                } else {
                    input.type = "password";

                    if (icon) {
                        icon.classList.remove(
                            "fa-eye-slash"
                        );

                        icon.classList.add("fa-eye");
                    }

                    this.setAttribute(
                        "aria-label",
                        "Show password"
                    );
                }
            });
        });
});

// ========================================
// LOGIN
// ========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

            const message =
                document.getElementById("loginMessage");

            const email =
                emailInput?.value
                    .trim()
                    .toLowerCase() || "";

            const password =
                passwordInput?.value || "";

            // Validation
            if (!email || !password) {
                showMessage(
                    message,
                    "Please enter your email and password."
                );
                return;
            }

            if (
                emailInput &&
                !emailInput.checkValidity()
            ) {
                showMessage(
                    message,
                    "Please enter a valid email address."
                );
                return;
            }

            showMessage(
                message,
                "Signing in...",
                "loading"
            );

            const submitButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );

                let data;

                try {
                    data =
                        await response.json();
                } catch (error) {
                    throw new Error(
                        "Server returned an invalid response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Invalid email or password."
                    );
                }

                if (!data.token) {
                    throw new Error(
                        "Login succeeded but no authentication token was returned."
                    );
                }

                // Save authentication token
                localStorage.setItem(
                    "token",
                    data.token
                );

                // Save user
                if (data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

                showMessage(
                    message,
                    "Login successful! Redirecting...",
                    "success"
                );

                
            window.location.href =
                        "pages/dashboard.html";
               

            } catch (error) {
                console.error(
                    "Login error:",
                    error
                );

                showMessage(
                    message,
                    error.message ||
                    "Unable to login. Please try again."
                );

                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        }
    );
}

// ========================================
// REGISTER
// ========================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            // ========================================
            // GET ELEMENTS
            // ========================================

            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

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
                registerForm.querySelector(
                    'button[type="submit"]'
                );

            // ========================================
            // GET VALUES
            // ========================================

            const name =
                nameInput?.value.trim() || "";

            const email =
                emailInput?.value
                    .trim()
                    .toLowerCase() || "";

            const password =
                passwordInput?.value || "";

            const confirmPassword =
                confirmPasswordInput?.value || "";

            // ========================================
            // BASIC VALIDATION
            // ========================================

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {
                showMessage(
                    message,
                    "Please fill in all required fields."
                );
                return;
            }

            // ========================================
            // NAME VALIDATION
            // ========================================

            if (name.length < 2) {
                showMessage(
                    message,
                    "Please enter your name."
                );
                return;
            }

            // ========================================
            // EMAIL VALIDATION
            // ========================================

            if (
                emailInput &&
                !emailInput.checkValidity()
            ) {
                showMessage(
                    message,
                    "Please enter a valid email address."
                );
                return;
            }

            // ========================================
            // TERMS
            // ========================================

            if (
                !termsCheckbox ||
                !termsCheckbox.checked
            ) {
                showMessage(
                    message,
                    "Please accept the Terms of Service and Privacy Policy."
                );
                return;
            }

            // ========================================
            // PASSWORD VALIDATION
            // ========================================

            if (password.length < 8) {
                showMessage(
                    message,
                    "Password must be at least 8 characters long."
                );
                return;
            }

            if (!/[A-Z]/.test(password)) {
                showMessage(
                    message,
                    "Password must contain at least one uppercase letter."
                );
                return;
            }

            if (!/[0-9]/.test(password)) {
                showMessage(
                    message,
                    "Password must contain at least one number."
                );
                return;
            }

            if (!/[^A-Za-z0-9]/.test(password)) {
                showMessage(
                    message,
                    "Password must contain at least one special character."
                );
                return;
            }

            // ========================================
            // CONFIRM PASSWORD
            // ========================================

            if (password !== confirmPassword) {
                showMessage(
                    message,
                    "Passwords do not match."
                );
                return;
            }

            // ========================================
            // SPLIT NAME
            // ========================================

            const nameParts =
                name.split(/\s+/);

            const firstName =
                nameParts.shift();

            const lastName =
                nameParts.length > 0
                    ? nameParts.join(" ")
                    : "";

            // ========================================
            // DISABLE BUTTON
            // ========================================

            if (button) {
                button.disabled = true;

                const buttonText =
                    button.querySelector("span");

                if (buttonText) {
                    buttonText.textContent =
                        "Sending OTP...";
                }
            }

            showMessage(
                message,
                "Creating your account and sending OTP...",
                "loading"
            );

            // ========================================
            // REGISTER API REQUEST
            // ========================================

            try {
                const url =
                    `${API_URL}/api/auth/register`;

                console.log(
                    "Registration URL:",
                    url
                );

                console.log(
                    "Registration email:",
                    email
                );

                const response =
                    await fetch(
                        url,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                first_name:
                                    firstName,

                                last_name:
                                    lastName,

                                email:
                                    email,

                                password:
                                    password
                            })
                        }
                    );

                // ========================================
                // READ SERVER RESPONSE
                // ========================================

                let data;

                try {
                    data =
                        await response.json();
                } catch (jsonError) {
                    console.error(
                        "Invalid JSON response:",
                        jsonError
                    );

                    throw new Error(
                        "The server returned an invalid response."
                    );
                }

                console.log(
                    "Registration response:",
                    data
                );

                // ========================================
                // SERVER ERROR
                // ========================================

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Registration failed."
                    );
                }

                // ========================================
                // SAVE PENDING OTP EMAIL
                // ========================================

                localStorage.setItem(
                    "pendingOtpEmail",
                    email
                );

                localStorage.setItem(
                    "pendingOtpName",
                    name
                );

                // Also save to sessionStorage
                // for compatibility
                sessionStorage.setItem(
                    "registrationEmail",
                    email
                );

                sessionStorage.setItem(
                    "registrationName",
                    name
                );

                // ========================================
                // SUCCESS
                // ========================================

                showMessage(
                    message,
                    "OTP sent successfully! Check your email.",
                    "success"
                );

                if (button) {
                    const buttonText =
                        button.querySelector("span");

                    if (buttonText) {
                        buttonText.textContent =
                            "OTP Sent";
                    }
                }

                // ========================================
                // REDIRECT TO OTP PAGE
                // ========================================

                setTimeout(() => {
                    window.location.href =
                        "verify.html";
                }, 1000);

            } catch (error) {
                console.error(
                    "Registration error:",
                    error
                );

                let errorMessage =
                    "Registration failed. Please try again.";

                if (
                    error instanceof TypeError
                ) {
                    errorMessage =
                        "Cannot connect to the server. Make sure your Node.js server and Cloudflare Tunnel are running.";
                } else if (error.message) {
                    errorMessage =
                        error.message;
                }

                showMessage(
                    message,
                    errorMessage,
                    "error"
                );

                if (button) {
                    button.disabled = false;

                    const buttonText =
                        button.querySelector("span");

                    if (buttonText) {
                        buttonText.textContent =
                            "Create Account";
                    }
                }
            }
        }
    );
}

// ========================================
// OTP VERIFICATION
// ========================================

const otpForm =
    document.getElementById("otpForm");

if (otpForm) {
    otpForm.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            // Prevent duplicate submissions
            if (
                otpForm.dataset.submitting ===
                "true"
            ) {
                return;
            }

            const otpInput =
                document.getElementById("otp");

            const message =
                document.getElementById(
                    "otpMessage"
                ) ||
                document.getElementById(
                    "message"
                );

            // ========================================
            // GET EMAIL
            // ========================================

            const email =
                localStorage.getItem(
                    "pendingOtpEmail"
                ) ||
                sessionStorage.getItem(
                    "registrationEmail"
                );

            const otp =
                otpInput?.value.trim() || "";

            // ========================================
            // VALIDATE EMAIL
            // ========================================

            if (!email) {
                showMessage(
                    message,
                    "No pending registration found. Please register again."
                );
                return;
            }

            // ========================================
            // VALIDATE OTP
            // ========================================

            if (!/^\d{6}$/.test(otp)) {
                showMessage(
                    message,
                    "OTP must contain exactly 6 numbers."
                );
                return;
            }

            // ========================================
            // START SUBMISSION
            // ========================================

            otpForm.dataset.submitting =
                "true";

            const submitButton =
                otpForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent =
                    "Verifying...";
            }

            showMessage(
                message,
                "Verifying OTP...",
                "loading"
            );

            // ========================================
            // VERIFY OTP
            // ========================================

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/auth/verify-otp`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                otp: otp
                            })
                        }
                    );

                let data;

                try {
                    data =
                        await response.json();
                } catch (jsonError) {
                    throw new Error(
                        "The server returned an invalid response."
                    );
                }

                console.log(
                    "OTP verification response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Invalid or expired OTP."
                    );
                }

                // ========================================
                // OTP VERIFIED
                // ========================================

                showMessage(
                    message,
                    "Email verified successfully! Your account has been created.",
                    "success"
                );

                // Remove pending registration
                localStorage.removeItem(
                    "pendingOtpEmail"
                );

                localStorage.removeItem(
                    "pendingOtpName"
                );

                sessionStorage.removeItem(
                    "registrationEmail"
                );

                sessionStorage.removeItem(
                    "registrationName"
                );

                // ========================================
                // REDIRECT TO LOGIN
                // ========================================

                setTimeout(() => {
                    window.location.href =
                        "login.html";
                }, 1500);

            } catch (error) {
                console.error(
                    "OTP verification error:",
                    error
                );

                showMessage(
                    message,
                    error.message ||
                    "OTP verification failed.",
                    "error"
                );

                otpForm.dataset.submitting =
                    "false";

                if (submitButton) {
                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Verify OTP";
                }
            }
        }
    );
}

// ========================================
// OTP INPUT
// ========================================

const otpInput =
    document.getElementById("otp");

if (otpInput) {
    otpInput.addEventListener(
        "input",
        function () {
            this.value =
                this.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
        }
    );
}

// ========================================
// RESEND OTP
// ========================================

const resendOtpBtn =
    document.getElementById(
        "resendOtpBtn"
    ) ||
    document.getElementById(
        "resendButton"
    );

if (resendOtpBtn) {
    resendOtpBtn.addEventListener(
        "click",
        async function (event) {
            event.preventDefault();

            const message =
                document.getElementById(
                    "otpMessage"
                ) ||
                document.getElementById(
                    "message"
                );

            const email =
                localStorage.getItem(
                    "pendingOtpEmail"
                ) ||
                sessionStorage.getItem(
                    "registrationEmail"
                );

            if (!email) {
                showMessage(
                    message,
                    "No pending registration found. Please register again."
                );
                return;
            }

            resendOtpBtn.disabled = true;
            resendOtpBtn.textContent =
                "Sending...";

            showMessage(
                message,
                "Sending a new OTP...",
                "loading"
            );

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/auth/resend-otp`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );

                let data;

                try {
                    data =
                        await response.json();
                } catch (jsonError) {
                    throw new Error(
                        "The server returned an invalid response."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Unable to resend OTP."
                    );
                }

                showMessage(
                    message,
                    "A new 6-digit OTP has been sent to your email.",
                    "success"
                );

                // ========================================
                // 30 SECOND RESEND COOLDOWN
                // ========================================

                let seconds = 30;

                resendOtpBtn.textContent =
                    `Resend OTP (${seconds}s)`;

                const countdown =
                    setInterval(() => {
                        seconds--;

                        resendOtpBtn.textContent =
                            `Resend OTP (${seconds}s)`;

                        if (seconds <= 0) {
                            clearInterval(
                                countdown
                            );

                            resendOtpBtn.disabled =
                                false;

                            resendOtpBtn.textContent =
                                "Resend OTP";
                        }
                    }, 1000);

            } catch (error) {
                console.error(
                    "Resend OTP error:",
                    error
                );

                showMessage(
                    message,
                    error.message ||
                    "Unable to resend OTP.",
                    "error"
                );

                resendOtpBtn.disabled =
                    false;

                resendOtpBtn.textContent =
                    "Resend OTP";
            }
        }
    );
}

// ========================================
// PASSWORD STRENGTH
// ========================================

const passwordInput =
    document.getElementById("password");

if (passwordInput) {
    passwordInput.addEventListener(
        "input",
        function () {
            const value =
                this.value;

            const hasLength =
                value.length >= 8;

            const hasUppercase =
                /[A-Z]/.test(value);

            const hasNumber =
                /[0-9]/.test(value);

            const hasSpecial =
                /[^A-Za-z0-9]/.test(value);

            // ========================================
            // PASSWORD HINTS
            // ========================================

            const hintLength =
                document.getElementById(
                    "hint-length"
                );

            const hintUppercase =
                document.getElementById(
                    "hint-uppercase"
                );

            const hintNumber =
                document.getElementById(
                    "hint-number"
                );

            const hintSpecial =
                document.getElementById(
                    "hint-special"
                );

            if (hintLength) {
                hintLength.classList.toggle(
                    "valid",
                    hasLength
                );
            }

            if (hintUppercase) {
                hintUppercase.classList.toggle(
                    "valid",
                    hasUppercase
                );
            }

            if (hintNumber) {
                hintNumber.classList.toggle(
                    "valid",
                    hasNumber
                );
            }

            if (hintSpecial) {
                hintSpecial.classList.toggle(
                    "valid",
                    hasSpecial
                );
            }

            // ========================================
            // PASSWORD STRENGTH
            // ========================================

            let strength = 0;

            if (hasLength) strength++;
            if (hasUppercase) strength++;
            if (hasNumber) strength++;
            if (hasSpecial) strength++;

            const bars =
                document.querySelectorAll(
                    ".strength-bar"
                );

            bars.forEach(
                (bar, index) => {
                    if (index < strength) {
                        bar.classList.add(
                            "active"
                        );
                    } else {
                        bar.classList.remove(
                            "active"
                        );
                    }
                }
            );
        }
    );
}

// ========================================
// NAME VALIDATION
// ========================================

const nameInput =
    document.getElementById("name");

if (nameInput) {
    nameInput.addEventListener(
        "input",
        function () {
            const wrapper =
                this.closest(
                    ".input-wrapper"
                );

            const icon =
                wrapper?.querySelector(
                    ".input-valid-icon"
                );

            if (!icon) return;

            const valid =
                this.value.trim().length >= 2;

            icon.style.opacity =
                valid ? "1" : "0";
        }
    );
}

// ========================================
// EMAIL VALIDATION
// ========================================

const emailInput =
    document.getElementById("email");

if (emailInput) {
    emailInput.addEventListener(
        "input",
        function () {
            const wrapper =
                this.closest(
                    ".input-wrapper"
                );

            const icon =
                wrapper?.querySelector(
                    ".input-valid-icon"
                );

            if (!icon) return;

            const valid =
                this.value.trim() &&
                this.checkValidity();

            icon.style.opacity =
                valid ? "1" : "0";
        }
    );
}

// ========================================
// CONFIRM PASSWORD VALIDATION
// ========================================

const confirmInput =
    document.getElementById(
        "confirmPassword"
    );

if (confirmInput) {
    confirmInput.addEventListener(
        "input",
        function () {
            const password =
                document.getElementById(
                    "password"
                )?.value || "";

            const wrapper =
                this.closest(
                    ".input-wrapper"
                );

            const icon =
                wrapper?.querySelector(
                    ".input-valid-icon"
                );

            if (!icon) return;

            if (!this.value) {
                icon.style.opacity =
                    "0";
            } else if (
                this.value === password
            ) {
                icon.style.opacity =
                    "1";

                icon.style.color =
                    "#4b6a4b";

                icon.classList.remove(
                    "fa-times-circle"
                );

                icon.classList.add(
                    "fa-check-circle"
                );
            } else {
                icon.style.opacity =
                    "1";

                icon.style.color =
                    "#b35f5f";

                icon.classList.remove(
                    "fa-check-circle"
                );

                icon.classList.add(
                    "fa-times-circle"
                );
            }
        }
    );
}

// ========================================
// TERMS & PRIVACY MODALS
// ========================================

const termsModal =
    document.getElementById(
        "termsModal"
    );

const privacyModal =
    document.getElementById(
        "privacyModal"
    );

const termsLink =
    document.getElementById(
        "termsLink"
    );

const privacyLink =
    document.getElementById(
        "privacyLink"
    );

const closeTerms =
    document.getElementById(
        "closeModal"
    );

const closePrivacy =
    document.getElementById(
        "closePrivacyModal"
    );

const acceptTerms =
    document.getElementById(
        "acceptBtn"
    );

const declineTerms =
    document.getElementById(
        "declineBtn"
    );

const acceptPrivacy =
    document.getElementById(
        "acceptPrivacyBtn"
    );

const declinePrivacy =
    document.getElementById(
        "declinePrivacyBtn"
    );

// ========================================
// OPEN TERMS
// ========================================

if (termsLink && termsModal) {
    termsLink.addEventListener(
        "click",
        function (event) {
            event.preventDefault();

            termsModal.classList.add(
                "active"
            );

            document.body.style.overflow =
                "hidden";
        }
    );
}

// ========================================
// OPEN PRIVACY
// ========================================

if (privacyLink && privacyModal) {
    privacyLink.addEventListener(
        "click",
        function (event) {
            event.preventDefault();

            privacyModal.classList.add(
                "active"
            );

            document.body.style.overflow =
                "hidden";
        }
    );
}

// ========================================
// CLOSE TERMS
// ========================================

function closeTermsModal() {
    if (!termsModal) return;

    termsModal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}

if (closeTerms) {
    closeTerms.addEventListener(
        "click",
        closeTermsModal
    );
}

// ========================================
// CLOSE PRIVACY
// ========================================

function closePrivacyModal() {
    if (!privacyModal) return;

    privacyModal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}

if (closePrivacy) {
    closePrivacy.addEventListener(
        "click",
        closePrivacyModal
    );
}

// ========================================
// CLICK OUTSIDE MODAL
// ========================================

if (termsModal) {
    termsModal.addEventListener(
        "click",
        function (event) {
            if (event.target === this) {
                closeTermsModal();
            }
        }
    );
}

if (privacyModal) {
    privacyModal.addEventListener(
        "click",
        function (event) {
            if (event.target === this) {
                closePrivacyModal();
            }
        }
    );
}

// ========================================
// ACCEPT TERMS
// ========================================

if (acceptTerms) {
    acceptTerms.addEventListener(
        "click",
        function () {
            const checkbox =
                document.getElementById(
                    "termsCheckbox"
                );

            if (checkbox) {
                checkbox.checked = true;
            }

            closeTermsModal();
        }
    );
}

// ========================================
// DECLINE TERMS
// ========================================

if (declineTerms) {
    declineTerms.addEventListener(
        "click",
        function () {
            const checkbox =
                document.getElementById(
                    "termsCheckbox"
                );

            if (checkbox) {
                checkbox.checked = false;
            }

            closeTermsModal();
        }
    );
}

// ========================================
// ACCEPT PRIVACY
// ========================================

if (acceptPrivacy) {
    acceptPrivacy.addEventListener(
        "click",
        function () {
            closePrivacyModal();
        }
    );
}

// ========================================
// DECLINE PRIVACY
// ========================================

if (declinePrivacy) {
    declinePrivacy.addEventListener(
        "click",
        function () {
            closePrivacyModal();
        }
    );
}

// ========================================
// ESCAPE KEY
// ========================================

document.addEventListener(
    "keydown",
    function (event) {
        if (event.key !== "Escape") {
            return;
        }

        closeTermsModal();
        closePrivacyModal();
    }
);

// ========================================
// AUTH CHECK
// ========================================

function checkAuth() {
    const token =
        localStorage.getItem("token");

    const user =
        getStoredUser();

    if (!token || !user) {
        const path =
            window.location.pathname;

        if (
            !path.includes("login.html") &&
            !path.includes("register.html") &&
            !path.includes("verify.html")
        ) {
            window.location.href =
                "../login.html";
        }

        return false;
    }

    return true;
}

// ========================================
// LOGOUT
// ========================================

function logout() {
    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "../login.html";
}

window.logout = logout;

// ========================================
// DISPLAY USER INFORMATION
// ========================================

function displayUserInfo() {
    const user =
        getStoredUser();

    if (!user) return;

    const userNameElements =
        document.querySelectorAll(
            ".user-name"
        );

    const userEmailElements =
        document.querySelectorAll(
            ".user-email"
        );

    const fullName =
        user.name ||
        `${user.first_name || ""} ${user.last_name || ""}`
            .trim() ||
        "User";

    userNameElements.forEach(
        (element) => {
            element.textContent =
                fullName;
        }
    );

    userEmailElements.forEach(
        (element) => {
            element.textContent =
                user.email || "";
        }
    );
}

// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const path =
            window.location.pathname;

        const isLogin =
            path.includes("login.html");

        const isRegister =
            path.includes("register.html");

        const isVerifyOTP =
            path.includes("verify.html");

        // Only protected pages require auth
        if (
            !isLogin &&
            !isRegister &&
            !isVerifyOTP
        ) {
            checkAuth();
        }

        displayUserInfo();

        // ========================================
        // OTP PAGE
        // ========================================

        if (isVerifyOTP) {
            const email =
                localStorage.getItem(
                    "pendingOtpEmail"
                ) ||
                sessionStorage.getItem(
                    "registrationEmail"
                );

            const otpEmail =
                document.getElementById(
                    "otpEmail"
                ) ||
                document.getElementById(
                    "email"
                );

            if (otpEmail && email) {
                otpEmail.textContent =
                    email;
            }

            if (!email) {
                const message =
                    document.getElementById(
                        "otpMessage"
                    ) ||
                    document.getElementById(
                        "message"
                    );

                showMessage(
                    message,
                    "No pending registration found. Please register again."
                );
            }
        }
    }
);

// DEBUGGER FOR KONSOL SA WEBSITE

console.log(
    "========================================"
);

console.log(
    "PetCareConnect authentication loaded."
);

console.log(
    "API:",
    API_URL
);

console.log(
    "========================================"
);