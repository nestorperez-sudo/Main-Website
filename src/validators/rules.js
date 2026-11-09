/*
 * Small checks shared by every validator.
 *
 * Each check receives the raw value from the request and returns either
 *   { value }   the cleaned value to store, or
 *   { error }   a message to show next to the field.
 *
 * collect() runs a whole set of checks and builds the validator result,
 * keeping only the fields that were checked (unknown fields are dropped).
 */

const isMissing = (input) =>
    input === undefined || input === null || (typeof input === "string" && input.trim() === "");

function text(input, { required = false, min = 1, max, pattern, patternMessage } = {}) {
    if (isMissing(input)) {
        return required ? { error: "This field is required." } : { value: null };
    }
    if (typeof input !== "string") {
        return { error: "Must be text." };
    }
    const value = input.trim();
    if (value.length < min) {
        return { error: `Must be at least ${min} characters.` };
    }
    if (max !== undefined && value.length > max) {
        return { error: `Must be at most ${max} characters.` };
    }
    if (pattern && !pattern.test(value)) {
        return { error: patternMessage };
    }
    return { value };
}

function number(input, { required = false, integer = false, min, max, defaultValue = null } = {}) {
    if (input === undefined || input === null) {
        return required ? { error: "This field is required." } : { value: defaultValue };
    }
    if (typeof input !== "number" || !Number.isFinite(input)) {
        return { error: "Must be a number." };
    }
    if (integer && !Number.isInteger(input)) {
        return { error: "Must be a whole number." };
    }
    if ((min !== undefined && input < min) || (max !== undefined && input > max)) {
        return { error: `Must be between ${min} and ${max}.` };
    }
    return { value: input };
}

function boolean(input, { defaultValue = false } = {}) {
    if (input === undefined || input === null) {
        return { value: defaultValue };
    }
    if (typeof input !== "boolean") {
        return { error: "Must be true or false." };
    }
    return { value: input };
}

function oneOf(input, allowed, { required = false, defaultValue = null } = {}) {
    if (isMissing(input)) {
        return required ? { error: "This field is required." } : { value: defaultValue };
    }
    if (!allowed.includes(input)) {
        return { error: `Must be one of: ${allowed.join(", ")}.` };
    }
    return { value: input };
}

// "YYYY-MM-DD" that exists in the calendar (rejects 2026-02-30).
function date(input, { required = false } = {}) {
    if (isMissing(input)) {
        return required ? { error: "This field is required." } : { value: null };
    }
    const match = typeof input === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (match) {
        const [year, month, day] = match.slice(1).map(Number);
        const parsed = new Date(Date.UTC(year, month - 1, day));
        if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) {
            return { value: input };
        }
    }
    return { error: "Must be a valid date in YYYY-MM-DD format." };
}

// "HH:MM", 24-hour clock.
function time(input, { required = false } = {}) {
    if (isMissing(input)) {
        return required ? { error: "This field is required." } : { value: null };
    }
    if (typeof input !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input)) {
        return { error: "Must be a time in HH:MM format (00:00 to 23:59)." };
    }
    return { value: input };
}

// checks: { fieldName: resultOfACheck, ... }
function collect(checks) {
    const errors = [];
    const value = {};
    for (const [field, result] of Object.entries(checks)) {
        if (result.error) {
            errors.push({ field, message: result.error });
        } else {
            value[field] = result.value;
        }
    }
    return { valid: errors.length === 0, errors, value };
}

// req.body is undefined when no JSON was sent; treat anything that isn't an object as empty.
const asObject = (body) => (body && typeof body === "object" && !Array.isArray(body) ? body : {});

module.exports = { text, number, boolean, oneOf, date, time, collect, asObject };
