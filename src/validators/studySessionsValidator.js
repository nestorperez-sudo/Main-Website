const { text, number, boolean, date, collect, asObject } = require("./rules");

/*
 * Validates the body of POST and PUT /api/study-sessions.
 * Returns { valid, errors: [{ field, message }], value } (value = known fields only).
 * Whether courseId belongs to a real course is checked by the controller.
 */
function validateStudySession(body) {
    const input = asObject(body);

    return collect({
        courseId: number(input.courseId, { required: true, integer: true, min: 1 }),
        date: date(input.date, { required: true }),
        minutes: number(input.minutes, { required: true, integer: true, min: 5, max: 600 }),
        done: boolean(input.done, { defaultValue: false }),
        notes: text(input.notes, { max: 200 })
    });
}

module.exports = { validateStudySession };
