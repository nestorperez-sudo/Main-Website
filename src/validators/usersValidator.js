const { text, number, oneOf, collect, asObject } = require("./rules");

// Closed sets. The settings form uses exactly these values.
const THEMES = ["light", "dark", "system"];
const LANGUAGES = ["en", "es"];

// Simple format check: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/*
 * Validates the body of POST and PUT /api/users.
 * Returns { valid, errors: [{ field, message }], value } (value = known fields only).
 * No password field: the brief does not require authentication, so a
 * password sent by the sign-up form is stripped like any unknown field.
 */
function validateUser(body) {
    const input = asObject(body);

    return collect({
        name: text(input.name, { required: true, max: 60 }),
        email: text(input.email, {
            required: true,
            max: 100,
            pattern: EMAIL_PATTERN,
            patternMessage: "Must be a valid email address."
        }),
        university: text(input.university, { max: 80 }),
        degree: text(input.degree, { max: 80 }),
        weeklyGoal: number(input.weeklyGoal, { integer: true, min: 1, max: 80, defaultValue: 15 }),
        dailyGoal: number(input.dailyGoal, { integer: true, min: 1, max: 12, defaultValue: 2 }),
        theme: oneOf(input.theme, THEMES, { defaultValue: "system" }),
        language: oneOf(input.language, LANGUAGES, { defaultValue: "en" })
    });
}

module.exports = { validateUser, THEMES, LANGUAGES };
