const { text, number, oneOf, date, time, collect, asObject } = require("./rules");

// Closed set. The event form uses exactly these values.
const EVENT_TYPES = ["class", "study", "exam", "deadline"];

/*
 * Validates the body of POST and PUT /api/events.
 * Returns { valid, errors: [{ field, message }], value } (value = known fields only).
 * courseId is optional; if sent, the controller checks the course exists.
 */
function validateEvent(body) {
    const input = asObject(body);

    const result = collect({
        title: text(input.title, { required: true, max: 80 }),
        type: oneOf(input.type, EVENT_TYPES, { required: true }),
        date: date(input.date, { required: true }),
        startTime: time(input.startTime, { required: true }),
        endTime: time(input.endTime),
        location: text(input.location, { max: 80 }),
        courseId: number(input.courseId, { integer: true, min: 1 })
    });

    // Rule that involves two fields: only checked when both times are valid.
    // "HH:MM" strings compare correctly as text ("09:30" < "11:00").
    const { startTime, endTime } = result.value;
    if (startTime && endTime && endTime <= startTime) {
        result.errors.push({ field: "endTime", message: "Must be later than the start time." });
        result.valid = false;
    }

    return result;
}

module.exports = { validateEvent, EVENT_TYPES };
