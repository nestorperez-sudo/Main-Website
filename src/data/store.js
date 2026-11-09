/*
 * In-memory data store.
 *
 * Every resource is an array inside `data`. The rest of the app only uses
 * the functions exported at the bottom, never the arrays, so this file could
 * later be rewritten to talk to a real database without changing anything else.
 *
 * Data lives in RAM: restarting the server resets it to the seed data below.
 */

// Seed dates are relative to the day the server starts, so the dashboard and
// the schedule always have something to show: day(0) is today, day(1) tomorrow,
// day(-3) three days ago. Returns "YYYY-MM-DD".
function day(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const data = {
    courses: [
        { id: 1, code: "MAT-201", name: "Calculus II", instructor: "Prof. Elena Marín", meetingTimes: "Mon and Wed, 9:00 to 11:00", credits: 6, semester: "fall-2026", color: "blue", archived: false },
        { id: 2, code: "CS-210", name: "Data Structures", instructor: "Prof. Daniel Ortega", meetingTimes: "Wed 11:30 and Fri 9:00", credits: 6, semester: "fall-2026", color: "green", archived: false },
        { id: 3, code: "PHY-202", name: "Physics II", instructor: "Prof. Sofia Lindqvist", meetingTimes: "Tue 10:00 and Thu lab 10:00", credits: 6, semester: "fall-2026", color: "red", archived: false },
        { id: 4, code: "ECO-101", name: "Microeconomics", instructor: "Prof. Marcus Weber", meetingTimes: "Tue 12:30 and Thu 15:00", credits: 6, semester: "fall-2026", color: "violet", archived: false },
        { id: 5, code: "STA-220", name: "Statistics", instructor: "Prof. Laura Gil", meetingTimes: "Mon 15:00 and Thu 11:00", credits: 6, semester: "spring-2027", color: "green", archived: false },
        { id: 6, code: "ENG-105", name: "Academic English", instructor: "Prof. Hannah Reed", meetingTimes: null, credits: 3, semester: "fall-2026", color: "violet", archived: true }
    ],

    tasks: [
        { id: 1, title: "Physics II lab report", courseId: 3, type: "assignment", priority: "high", dueDate: day(0), dueTime: "23:59", reminder: "1-day", description: "Write up the pendulum experiment.", completed: false },
        { id: 2, title: "Review calculus chapters 4–5", courseId: 1, type: "study", priority: "high", dueDate: day(1), dueTime: null, reminder: "none", description: null, completed: false },
        { id: 3, title: "Microeconomics quiz", courseId: 4, type: "quiz", priority: "medium", dueDate: day(3), dueTime: "15:00", reminder: "3-days", description: null, completed: false },
        { id: 4, title: "Calculus II problem set", courseId: 1, type: "assignment", priority: "medium", dueDate: day(6), dueTime: "23:59", reminder: "1-day", description: "Problem set 4, exercises 1–12.", completed: false },
        { id: 5, title: "Data Structures milestone 1", courseId: 2, type: "project", priority: "high", dueDate: day(8), dueTime: null, reminder: "1-week", description: null, completed: false },
        { id: 6, title: "Review lecture notes", courseId: 1, type: "study", priority: "low", dueDate: day(-3), dueTime: null, reminder: "none", description: null, completed: true },
        { id: 7, title: "Read chapter 3", courseId: 4, type: "reading", priority: "low", dueDate: day(-4), dueTime: null, reminder: "none", description: null, completed: true }
    ],

    events: [
        { id: 1, title: "Calculus II lecture", type: "class", date: day(0), startTime: "09:00", endTime: "11:00", location: "Room 204", courseId: 1 },
        { id: 2, title: "Calculus II study session", type: "study", date: day(0), startTime: "11:30", endTime: "13:00", location: "Library, Study Room 3", courseId: 1 },
        { id: 3, title: "Physics II lab", type: "class", date: day(0), startTime: "14:00", endTime: "16:00", location: "Lab 2, Science Building", courseId: 3 },
        { id: 4, title: "Physics II lecture", type: "class", date: day(1), startTime: "10:00", endTime: "12:00", location: "Science Hall, Room 204", courseId: 3 },
        { id: 5, title: "Microeconomics quiz", type: "exam", date: day(3), startTime: "15:00", endTime: "16:00", location: "Room 108", courseId: 4 },
        { id: 6, title: "Calculus II problem set due", type: "deadline", date: day(6), startTime: "23:59", endTime: null, location: null, courseId: 1 },
        { id: 7, title: "Calculus II midterm", type: "exam", date: day(8), startTime: "09:00", endTime: "11:00", location: "Lecture Hall", courseId: 1 }
    ],

    // Done sessions (9 h in total) are in the last few days; planned ones are ahead.
    studySessions: [
        { id: 1, courseId: 1, date: day(0), minutes: 90, done: true, notes: "Chapter 4 exercises" },
        { id: 2, courseId: 3, date: day(0), minutes: 60, done: true, notes: null },
        { id: 3, courseId: 2, date: day(-1), minutes: 120, done: true, notes: "Linked lists" },
        { id: 4, courseId: 1, date: day(-1), minutes: 60, done: true, notes: null },
        { id: 5, courseId: 3, date: day(-2), minutes: 90, done: true, notes: "Lab report draft" },
        { id: 6, courseId: 1, date: day(-3), minutes: 60, done: true, notes: null },
        { id: 7, courseId: 4, date: day(-3), minutes: 60, done: true, notes: "Quiz revision" },
        { id: 8, courseId: 1, date: day(2), minutes: 90, done: false, notes: "Midterm practice exam" },
        { id: 9, courseId: 1, date: day(5), minutes: 60, done: false, notes: "Midterm review" },
        { id: 10, courseId: 1, date: day(7), minutes: 60, done: false, notes: "Midterm final review" }
    ],

    grades: [
        { id: 1, courseId: 1, title: "Problem set 1", score: 80, weight: 10, type: "assignment", date: "2026-09-28" },
        { id: 2, courseId: 1, title: "Problem set 2", score: 88, weight: 10, type: "assignment", date: "2026-10-19" },
        { id: 3, courseId: 2, title: "Lab exercises", score: 90, weight: 15, type: "assignment", date: "2026-10-02" },
        { id: 4, courseId: 2, title: "Quiz 1", score: 94, weight: 10, type: "quiz", date: "2026-10-23" },
        { id: 5, courseId: 3, title: "Lab 1 report", score: 72, weight: 15, type: "assignment", date: "2026-10-05" },
        { id: 6, courseId: 3, title: "Quiz 1", score: 78, weight: 10, type: "quiz", date: "2026-10-26" },
        { id: 7, courseId: 4, title: "Quiz 1", score: 84, weight: 10, type: "quiz", date: "2026-10-09" },
        { id: 8, courseId: 4, title: "Case study", score: 88, weight: 20, type: "project", date: "2026-10-30" }
    ],

    users: [
        { id: 1, name: "Alex Lopez", email: "alex@example.com", university: null, degree: null, weeklyGoal: 15, dailyGoal: 3, theme: "light", language: "en" }
    ]
};

// Next id for each collection: one more than the highest seed id.
const nextId = {};
for (const name of Object.keys(data)) {
    nextId[name] = Math.max(0, ...data[name].map((item) => item.id)) + 1;
}

// Return copies, so code outside this file can never change the stored data by accident.
const copy = (value) => structuredClone(value);

function getCollection(name) {
    const collection = data[name];
    if (!collection) {
        throw new Error(`Unknown collection: ${name}`);
    }
    return collection;
}

function findAll(name) {
    return copy(getCollection(name));
}

function findById(name, id) {
    const item = getCollection(name).find((entry) => entry.id === id);
    return item ? copy(item) : null;
}

// `item` must already be validated and must not contain an id.
function insert(name, item) {
    const created = { id: nextId[name]++, ...item };
    getCollection(name).push(created);
    return copy(created);
}

function replace(name, id, item) {
    const collection = getCollection(name);
    const index = collection.findIndex((entry) => entry.id === id);
    if (index === -1) {
        return null;
    }
    collection[index] = { id, ...item };
    return copy(collection[index]);
}

function remove(name, id) {
    const collection = getCollection(name);
    const index = collection.findIndex((entry) => entry.id === id);
    if (index === -1) {
        return false;
    }
    collection.splice(index, 1);
    return true;
}

// Deletes every item whose `field` equals `value` (used when a course is deleted).
function removeWhere(name, field, value) {
    const collection = getCollection(name);
    const kept = collection.filter((entry) => entry[field] !== value);
    const removedCount = collection.length - kept.length;
    data[name] = kept;
    return removedCount;
}

module.exports = { findAll, findById, insert, replace, remove, removeWhere };
