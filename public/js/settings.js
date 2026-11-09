/*
 * Settings page.
 *   GET    /api/users       fill the form (no login yet: the first user is "you")
 *   PUT    /api/users/:id   Save changes
 *   DELETE /api/users/:id   Delete account
 * Only fields of the users resource are saved: name, email, university, degree,
 * language, theme, weeklyGoal and dailyGoal. The other controls are not saved yet.
 */

const settingsForm = document.getElementById("settings-form");
const settingsStatus = document.getElementById("settings-status");
const settingsSaveMessage = document.getElementById("settings-save-message");
const settingsDeleteButton = document.getElementById("settings-delete-button");

let settingsUser = null;

function fillSettingsForm(user) {
    const fields = settingsForm.elements;
    fields.name.value = user.name;
    fields.email.value = user.email;
    fields.university.value = user.university ?? "";
    fields.degree.value = user.degree ?? "";
    fields.language.value = user.language;
    fields.theme.value = user.theme; // checks the radio button with this value
    fields.weeklyGoal.value = user.weeklyGoal;
    fields.dailyGoal.value = user.dailyGoal;

    // "Alex Lopez" -> "AL"
    const initials = user.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
    document.getElementById("settings-avatar").textContent = initials;
}

function setSettingsEnabled(enabled) {
    settingsForm.querySelector("[type='submit']").disabled = !enabled;
    settingsDeleteButton.disabled = !enabled;
}

async function loadSettings() {
    setSettingsEnabled(false);
    setStatus(settingsStatus, "loading", "Loading your profile…");
    try {
        const users = await apiRequest("GET", "/users");
        settingsUser = users[0] ?? null;
    } catch (error) {
        setStatus(settingsStatus, "error", `Couldn't load your profile. ${error.message}`);
        return;
    }

    if (!settingsUser) {
        setStatus(settingsStatus, "empty", "No account found. Create one from the sign-up page.");
        return;
    }
    clearStatus(settingsStatus);
    fillSettingsForm(settingsUser);
    setSettingsEnabled(true);
}

/* ---------- Save changes ---------- */

settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(settingsForm);

    const clientErrors = checkForm(settingsForm);
    if (clientErrors.length > 0) {
        showFieldErrors(settingsForm, clientErrors);
        return;
    }

    const fields = settingsForm.elements;
    const user = {
        name: fields.name.value,
        email: fields.email.value,
        university: fields.university.value || null,
        degree: fields.degree.value || null,
        language: fields.language.value,
        theme: fields.theme.value,
        weeklyGoal: Number(fields.weeklyGoal.value),
        dailyGoal: Number(fields.dailyGoal.value)
    };

    setSettingsEnabled(false);
    try {
        settingsUser = await apiRequest("PUT", `/users/${settingsUser.id}`, user);
        fillSettingsForm(settingsUser);
        settingsSaveMessage.textContent = "Changes saved.";
    } catch (error) {
        showSaveError(settingsForm, error);
    } finally {
        setSettingsEnabled(true);
    }
});

// "Discard changes" goes back to the saved values (a plain reset would show the HTML defaults).
settingsForm.addEventListener("reset", (event) => {
    event.preventDefault();
    clearFormErrors(settingsForm);
    if (settingsUser) {
        fillSettingsForm(settingsUser);
    }
});

/* ---------- Delete account ---------- */

settingsDeleteButton.addEventListener("click", async () => {
    if (!confirm("Delete your account? This cannot be undone.")) {
        return;
    }
    try {
        await apiRequest("DELETE", `/users/${settingsUser.id}`);
        window.location.href = "login.html";
    } catch (error) {
        setStatus(settingsStatus, "error", `Couldn't delete your account. ${error.message}`);
    }
});

loadSettings();
