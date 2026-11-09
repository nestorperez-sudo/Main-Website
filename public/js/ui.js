/*
 * Small helpers shared by the page scripts: status messages, form errors,
 * dates and course colours. No fetch here; that lives in api.js.
 */

/* ---------- Loading, error and empty states ---------- */

// state: "loading" | "error" | "empty". An empty message hides the element.
function setStatus(element, state, message = "") {
    if (!element) {
        return;
    }
    element.textContent = message;
    element.dataset.state = state;
    element.hidden = message === "";
}

const clearStatus = (element) => setStatus(element, "", "");

/* ---------- Form errors next to each field ---------- */

// Each field has <p class="field-error" data-error-for="fieldName"></p> under it,
// and the form has one <p class="form-error"> for problems not tied to a field.
function clearFormErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach((slot) => {
        slot.textContent = "";
    });
    form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
    const formError = form.querySelector(".form-error");
    if (formError) {
        formError.textContent = "";
    }
}

// errors: [{ field, message }], the same shape the API returns in a 400.
function showFieldErrors(form, errors) {
    const unplaced = [];

    errors.forEach(({ field, message }) => {
        const slot = form.querySelector(`[data-error-for="${field}"]`);
        if (!slot) {
            unplaced.push(message);
            return;
        }
        slot.textContent = message;
        form.elements[field]?.setAttribute?.("aria-invalid", "true");
    });

    if (unplaced.length > 0) {
        showFormError(form, unplaced.join(" "));
    }
    form.querySelector("[aria-invalid='true']")?.focus();
}

function showFormError(form, message) {
    const formError = form.querySelector(".form-error");
    if (formError) {
        formError.textContent = message;
    }
}

// Client-side check before sending: uses the HTML rules on each input
// (required, min, max, maxlength, pattern...), which mirror the API validators.
function checkForm(form) {
    const errors = [];
    const seen = new Set();

    Array.from(form.elements).forEach((element) => {
        if (!element.name || !element.willValidate || seen.has(element.name) || element.checkValidity()) {
            return;
        }
        seen.add(element.name);
        errors.push({ field: element.name, message: element.validationMessage });
    });

    return errors;
}

// After a failed save: a 400 goes next to the fields, anything else at the bottom.
function showSaveError(form, error) {
    if (error.status === 400 && error.errors.length > 0) {
        showFieldErrors(form, error.errors);
    } else {
        showFormError(form, error.message);
    }
}

/* ---------- Dates ---------- */

// "2026-11-09" -> Date at local midnight (new Date("2026-11-09") would be UTC).
function parseLocalDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function todayISO() {
    const now = new Date();
    const pad = (number) => String(number).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// "2026-11-09" -> "Mon, 9 Nov"
function formatShortDate(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// "2026-11-09" -> "9 Nov 2026"
function formatLongDate(isoDate) {
    return parseLocalDate(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------- Labels ---------- */

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const SEMESTER_LABELS = { "fall-2026": "Fall 2026", "spring-2027": "Spring 2027" };

// Course colour -> CSS class that sets --course-color / --course-background.
const colorClass = (color) => `color-${color}`;

// Average of a list of grades, rounded; null when there are none.
function averageScore(grades) {
    if (grades.length === 0) {
        return null;
    }
    return Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length);
}
