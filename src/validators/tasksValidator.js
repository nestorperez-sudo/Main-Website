const { text, number, boolean, oneOf, date, time, collect, asObject } = require("./rules");

// Closed sets. The Add-task form uses exactly these values.
const TASK_TYPES = ["assignment", "exam", "project", "personal", "quiz", "study", "reading"];
const PRIORITIES = ["low", "medium", "high"];
const REMINDERS = ["none", "1-day", "3-days", "1-week"];

/*
 * Validates the body of POST and PUT /api/tasks.
 * Returns { valid, errors: [{ field, message }], value } (value = known fields only).
 * Whether courseId belongs to a real course is checked by the controller.
 */
function validateTask(body) {
    const input = asObject(body);

    return collect({
        title: text(input.title, { required: true, max: 100 }),
        courseId: number(input.courseId, { required: true, integer: true, min: 1 }),
        type: oneOf(input.type, TASK_TYPES, { required: true }),
        priority: oneOf(input.priority, PRIORITIES, { required: true }),
        dueDate: date(input.dueDate, { required: true }),
        dueTime: time(input.dueTime),
        reminder: oneOf(input.reminder, REMINDERS, { defaultValue: "none" }),
        description: text(input.description, { max: 500 }),
        completed: boolean(input.completed, { defaultValue: false })
    });
}

module.exports = { validateTask, TASK_TYPES, PRIORITIES, REMINDERS };
