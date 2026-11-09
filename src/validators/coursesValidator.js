const { text, number, boolean, oneOf, collect, asObject } = require("./rules");

// Closed sets. The <select> lists in the pages use exactly these values.
const SEMESTERS = ["fall-2026", "spring-2027"];
const COLORS = ["blue", "green", "red", "violet"];

/*
 * Validates the body of POST and PUT /api/courses.
 * Returns { valid, errors: [{ field, message }], value }.
 * `value` holds only the known fields, cleaned and with defaults applied,
 * so a client-sent id or any unknown field is never stored.
 */
function validateCourse(body) {
    const input = asObject(body);

    return collect({
        code: text(input.code, {
            required: true,
            min: 3,
            max: 10,
            pattern: /^[A-Za-z0-9-]+$/,
            patternMessage: "Use only letters, numbers and hyphens (e.g. MAT-201)."
        }),
        name: text(input.name, { required: true, max: 60 }),
        instructor: text(input.instructor, { required: true, max: 60 }),
        meetingTimes: text(input.meetingTimes, { max: 80 }),
        credits: number(input.credits, { required: true, integer: true, min: 1, max: 12 }),
        semester: oneOf(input.semester, SEMESTERS, { required: true }),
        color: oneOf(input.color, COLORS, { required: true }),
        archived: boolean(input.archived, { defaultValue: false })
    });
}

/*
 * Validates the query string of GET /api/courses.
 * Every parameter is optional; unknown parameters are ignored.
 * Returns { valid, errors, filters } where filters only contains the
 * parameters that were sent, already converted (archived becomes a boolean).
 */
function validateCourseQuery(query) {
    const errors = [];
    const filters = {};
    const { search, semester, archived } = query;

    if (search !== undefined) {
        if (typeof search !== "string") {
            errors.push({ field: "search", message: "Send search only once." });
        } else if (search.trim() !== "") {
            filters.search = search.trim();
        }
    }

    if (semester !== undefined) {
        if (!SEMESTERS.includes(semester)) {
            errors.push({ field: "semester", message: `Must be one of: ${SEMESTERS.join(", ")}.` });
        } else {
            filters.semester = semester;
        }
    }

    if (archived !== undefined) {
        if (archived !== "true" && archived !== "false") {
            errors.push({ field: "archived", message: "Must be true or false." });
        } else {
            filters.archived = archived === "true";
        }
    }

    return { valid: errors.length === 0, errors, filters };
}

module.exports = { validateCourse, validateCourseQuery, SEMESTERS, COLORS };
