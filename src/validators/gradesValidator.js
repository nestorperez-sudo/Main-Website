const { text, number, oneOf, date, collect, asObject } = require("./rules");

// Closed set. The grade form uses exactly these values.
const GRADE_TYPES = ["exam", "assignment", "project", "quiz"];

/*
 * Validates the body of POST and PUT /api/grades.
 * Returns { valid, errors: [{ field, message }], value } (value = known fields only).
 * Whether courseId belongs to a real course is checked by the controller.
 */
function validateGrade(body) {
    const input = asObject(body);

    return collect({
        courseId: number(input.courseId, { required: true, integer: true, min: 1 }),
        title: text(input.title, { required: true, max: 80 }),
        score: number(input.score, { required: true, min: 0, max: 100 }),
        weight: number(input.weight, { required: true, min: 0, max: 100 }),
        type: oneOf(input.type, GRADE_TYPES, { required: true }),
        date: date(input.date, { required: true })
    });
}

module.exports = { validateGrade, GRADE_TYPES };
