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

/* Sign in (prototype): the brief does not require authentication, so after the
   browser checks the fields it simply opens the dashboard. */
signinSection.addEventListener("submit", (event) => {
    event.preventDefault();
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

/* Sign up: POST /api/users. Only name and email are sent; passwords are not
   stored because the brief does not require authentication. */
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(signupForm);
    validatePasswordMatch();

    // Client-side check first: the browser shows its message on the first invalid field.
    if (!signupForm.reportValidity()) {
        return;
    }

    const submitButton = signupForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        const user = await apiRequest("POST", "/users", {
            name: signupForm.elements.name.value,
            email: signupForm.elements.email.value
        });
        signupForm.reset();
        signupStatus.textContent = `Account created for ${user.name}. You can now sign in.`;
        signupStatus.hidden = false;
    } catch (error) {
        showSaveError(signupForm, error); // 400 messages appear under each field
    } finally {
        submitButton.disabled = false;
    }
});

signupForm.addEventListener("input", () => {
    signupStatus.hidden = true;
});
