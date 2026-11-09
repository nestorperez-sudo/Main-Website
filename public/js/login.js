const signinSection = document.getElementById("signin-section");
const signinButtonArea = signinSection.querySelector(".signin-button");
const signupSection = document.getElementById("signup-section");
const authModeToggle = document.getElementById("auth-mode-toggle");
const authModeLabel = authModeToggle.querySelector("span");
const signinModeButton = document.getElementById("signin-mode-button");
const signupForm = document.getElementById("signup-form");
const signupPassword = document.getElementById("signup-password");
const confirmPassword = document.getElementById("signup-confirm-password");
const signupStatus = document.getElementById("signup-status");

function showSignup(show) {
    signinSection.hidden = show;
    signupSection.hidden = !show;
    authModeToggle.setAttribute("aria-expanded", String(show));
    authModeLabel.textContent = show ? "Sign In" : "Sign Up";
}

authModeToggle.addEventListener("click", () => {
    showSignup(signupSection.hidden);
});

signinModeButton.addEventListener("click", () => {
    showSignup(false);
});

/* Sign in (prototype): validates the fields, then opens the dashboard. */
signinSection.addEventListener("submit", (event) => {
    event.preventDefault();
    // BACKEND: send the credentials to the auth endpoint and redirect only on success.
    window.location.href = "index.html";
});

// The whole styled bar acts as the submit button, not only the inner text.
signinButtonArea.addEventListener("click", (event) => {
    if (!event.target.closest("button")) {
        signinSection.requestSubmit();
    }
});

function validatePasswordMatch() {
    confirmPassword.setCustomValidity(
        confirmPassword.value && confirmPassword.value !== signupPassword.value
            ? "Passwords do not match."
            : ""
    );
}

signupPassword.addEventListener("input", validatePasswordMatch);
confirmPassword.addEventListener("input", validatePasswordMatch);

signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    validatePasswordMatch();

    if (!signupForm.reportValidity()) {
        return;
    }

    // BACKEND: create the account here instead of showing the prototype notice.
    signupStatus.hidden = false;
});

signupForm.addEventListener("input", () => {
    signupStatus.hidden = true;
});
