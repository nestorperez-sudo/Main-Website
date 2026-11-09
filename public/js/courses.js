/*
 * Courses page.
 *   GET    /api/courses?search=&semester=&archived=   list (filtered on the server)
 *   GET    /api/courses/stats                          summary under the heading
 *   POST / PUT / DELETE /api/courses                   add, edit, delete a course
 *   GET    /api/tasks, /api/grades                     card details and the detail dialog
 *   POST / PUT / DELETE /api/grades                    grades inside the detail dialog
 */

const courseGrid = document.getElementById("courses");
const coursesStatus = document.getElementById("courses-status");
const coursesSummary = document.getElementById("courses-summary");
const addCourseCard = document.getElementById("add-course");
const filterForm = document.getElementById("courses-filters");
const searchInput = document.getElementById("course-search");
const semesterFilter = document.getElementById("course-semester-filter");
const archivedTabs = document.querySelectorAll("[data-archived]");

const courseFormDialog = document.getElementById("course-form-dialog");
const courseForm = document.getElementById("course-form");
const courseFormTitle = document.getElementById("course-form-title");

const detailDialog = document.getElementById("course-detail-dialog");
const gradeList = document.getElementById("course-detail-grades");
const gradesStatus = document.getElementById("grades-status");
const gradeForm = document.getElementById("grade-form");
const gradeFormTitle = document.getElementById("grade-form-title");
const gradeCancelEdit = document.getElementById("grade-cancel-edit");

let courses = [];      // the courses currently shown (already filtered by the server)
let tasks = [];        // every task, for "open tasks" and "next deadline"
let grades = [];       // every grade, for "current grade" and the detail dialog
let showArchived = false;
let editingCourseId = null;
let detailCourse = null;  // course open in the detail dialog
let editingGradeId = null;
let lastFocused = null;   // element to focus again when a dialog closes

/* ---------- Loading data ---------- */

function buildCoursesQuery() {
    const params = new URLSearchParams();
    const search = searchInput.value.trim();
    if (search) {
        params.set("search", search);
    }
    if (semesterFilter.value) {
        params.set("semester", semesterFilter.value);
    }
    params.set("archived", String(showArchived));
    return `?${params}`;
}

async function loadCourses() {
    setStatus(coursesStatus, "loading", "Loading courses…");

    try {
        courses = await apiRequest("GET", `/courses${buildCoursesQuery()}`);
        renderCourses();
    } catch (error) {
        courseGrid.replaceChildren(addCourseCard);
        setStatus(coursesStatus, "error", `Couldn't load courses. ${error.message}`);
    }
}

// Tasks and grades don't change with the filters, so they're loaded separately.
async function loadTasksAndGrades() {
    [tasks, grades] = await Promise.all([apiRequest("GET", "/tasks"), apiRequest("GET", "/grades")]);
}

async function loadStats() {
    try {
        const stats = await apiRequest("GET", "/courses/stats");
        const average = stats.averageGrade === null ? "no grades yet" : `average grade ${stats.averageGrade}%`;
        coursesSummary.textContent =
            `${stats.active} active, ${stats.archived} archived · ${stats.totalCredits} credits · ${average}`;
    } catch {
        coursesSummary.textContent = "Couldn't load the course summary.";
    }
}

/* ---------- Rendering the cards ---------- */

function describeNextDeadline(courseTasks) {
    const next = courseTasks
        .filter((task) => !task.completed && task.dueDate >= todayISO())
        .sort((first, second) => first.dueDate.localeCompare(second.dueDate))[0];
    return next ? `${next.title}, ${formatShortDate(next.dueDate)}` : "None";
}

function createDetailsList(course) {
    const courseTasks = tasks.filter((task) => task.courseId === course.id);
    const average = averageScore(grades.filter((grade) => grade.courseId === course.id));

    const rows = [
        ["Current grade", average === null ? "—" : `${average}%`],
        ["Open tasks", String(courseTasks.filter((task) => !task.completed).length)],
        ["Next deadline", describeNextDeadline(courseTasks)],
        ["Credits", String(course.credits)]
    ];

    const list = document.createElement("dl");
    list.className = "course-details";
    rows.forEach(([term, value]) => {
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = term;
        dd.textContent = value;
        row.append(dt, dd);
        list.append(row);
    });
    return { list, average };
}

function createTextButton(label, ariaLabel, onClick, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `text-button ${extraClass}`.trim();
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
}

function createCourseCard(course) {
    const card = document.createElement("article");
    card.className = `card course-card ${colorClass(course.color)}`;

    const top = document.createElement("div");
    const code = document.createElement("span");
    const mark = document.createElement("span");
    const icon = document.createElement("i");
    top.className = "course-card-top";
    code.className = "course-code";
    code.textContent = course.code;
    mark.className = "course-color-mark";
    mark.setAttribute("aria-hidden", "true");
    icon.className = "fa-solid fa-book";
    mark.append(icon);
    top.append(code, mark);

    const name = document.createElement("h2");
    name.textContent = course.name;

    const instructor = document.createElement("p");
    instructor.className = "course-instructor";
    instructor.textContent = course.instructor;

    card.append(top, name, instructor);

    if (course.meetingTimes) {
        const meeting = document.createElement("p");
        const clock = document.createElement("i");
        meeting.className = "course-meeting";
        clock.className = "fa-regular fa-clock";
        clock.setAttribute("aria-hidden", "true");
        meeting.append(clock, course.meetingTimes);
        card.append(meeting);
    }

    const { list, average } = createDetailsList(course);
    const progress = document.createElement("div");
    const bar = document.createElement("span");
    progress.className = "course-progress";
    progress.setAttribute("role", "img");
    progress.setAttribute("aria-label", average === null ? "No grades yet" : `Current grade ${average} percent`);
    bar.style.width = `${average ?? 0}%`;
    progress.append(bar);

    const footer = document.createElement("div");
    const semester = document.createElement("span");
    const actions = document.createElement("div");
    footer.className = "course-card-footer";
    semester.textContent = SEMESTER_LABELS[course.semester] + (course.archived ? " · Archived" : "");
    actions.className = "course-card-actions";
    actions.append(
        createTextButton("Details", `Open ${course.name} details`, (event) => openCourseDetails(course, event.currentTarget)),
        createTextButton("Edit", `Edit ${course.name}`, (event) => openCourseForm(course, event.currentTarget)),
        createTextButton("Delete", `Delete ${course.name}`, () => deleteCourse(course), "danger")
    );
    footer.append(semester, actions);

    card.append(list, progress, footer);
    return card;
}

function renderCourses() {
    courseGrid.replaceChildren(...courses.map(createCourseCard), addCourseCard);

    if (courses.length > 0) {
        clearStatus(coursesStatus);
    } else if (searchInput.value.trim() || semesterFilter.value) {
        setStatus(coursesStatus, "empty", "No courses match your search.");
    } else {
        setStatus(coursesStatus, "empty", showArchived ? "No archived courses yet." : "No active courses yet. Add your first one.");
    }
}

/* ---------- Search and filters (run on the server) ---------- */

// Enter in the search box or the Search button submits the form.
filterForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stay on the page instead of reloading it
    loadCourses();
});
semesterFilter.addEventListener("change", loadCourses);

archivedTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        showArchived = tab.dataset.archived === "true";
        archivedTabs.forEach((other) => other.setAttribute("aria-pressed", String(other === tab)));
        loadCourses();
    });
});

/* ---------- Dialog helpers ---------- */

function openDialog(dialog, opener) {
    lastFocused = opener ?? document.activeElement;
    dialog.showModal();
}

[courseFormDialog, detailDialog].forEach((dialog) => {
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
        button.addEventListener("click", () => dialog.close());
    });
    // Clicking the dark backdrop (outside the content) closes the dialog.
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener("close", () => lastFocused?.focus());
});

/* ---------- Add / edit a course ---------- */

function openCourseForm(course, opener) {
    editingCourseId = course ? course.id : null;
    courseForm.reset();
    clearFormErrors(courseForm);
    courseFormTitle.textContent = course ? `Edit ${course.name}` : "Add a course";

    if (course) {
        const fields = courseForm.elements;
        fields.code.value = course.code;
        fields.name.value = course.name;
        fields.instructor.value = course.instructor;
        fields.meetingTimes.value = course.meetingTimes ?? "";
        fields.credits.value = course.credits;
        fields.semester.value = course.semester;
        fields.color.value = course.color;
        fields.archived.checked = course.archived;
    }
    openDialog(courseFormDialog, opener);
}

document.getElementById("add-course-button").addEventListener("click", (event) => openCourseForm(null, event.currentTarget));
addCourseCard.addEventListener("click", (event) => openCourseForm(null, event.currentTarget));

courseForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(courseForm);

    const clientErrors = checkForm(courseForm);
    if (clientErrors.length > 0) {
        showFieldErrors(courseForm, clientErrors);
        return;
    }

    const fields = courseForm.elements;
    const course = {
        code: fields.code.value,
        name: fields.name.value,
        instructor: fields.instructor.value,
        meetingTimes: fields.meetingTimes.value || null,
        credits: Number(fields.credits.value),
        semester: fields.semester.value,
        color: fields.color.value,
        archived: fields.archived.checked
    };

    const submitButton = courseForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        if (editingCourseId === null) {
            await apiRequest("POST", "/courses", course);
        } else {
            await apiRequest("PUT", `/courses/${editingCourseId}`, course);
        }
        courseFormDialog.close();
        await Promise.all([loadCourses(), loadStats()]);
    } catch (error) {
        showSaveError(courseForm, error);
    } finally {
        submitButton.disabled = false;
    }
});

/* ---------- Delete a course ---------- */

async function deleteCourse(course) {
    const confirmed = confirm(
        `Delete ${course.name}? Its tasks, events, study sessions and grades will be deleted too.`
    );
    if (!confirmed) {
        return;
    }

    try {
        await apiRequest("DELETE", `/courses/${course.id}`);
        // The server also deleted the course's tasks and grades, so reload them.
        await loadTasksAndGrades();
        await Promise.all([loadCourses(), loadStats()]);
    } catch (error) {
        setStatus(coursesStatus, "error", `Couldn't delete ${course.name}. ${error.message}`);
    }
}

/* ---------- Detail dialog: summary, grades and deadlines ---------- */

function renderCourseDetails() {
    const course = detailCourse;
    document.getElementById("course-detail-code").textContent = course.code;
    document.getElementById("course-detail-title").textContent = course.name;
    document.getElementById("course-detail-instructor").textContent = course.instructor;
    document.getElementById("course-detail-meeting").textContent = course.meetingTimes ?? "No class times set.";
    document.getElementById("course-detail-summary").replaceChildren(createDetailsList(course).list);

    // Grades
    const courseGrades = grades
        .filter((grade) => grade.courseId === course.id)
        .sort((first, second) => first.date.localeCompare(second.date));
    gradeList.replaceChildren(...courseGrades.map(createGradeItem));
    if (courseGrades.length === 0) {
        setStatus(gradesStatus, "empty", "No grades yet. Add the first one below.");
    } else {
        clearStatus(gradesStatus);
    }

    // Upcoming tasks of this course
    const upcoming = tasks
        .filter((task) => task.courseId === course.id && !task.completed)
        .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
    const assignmentItems = upcoming.map((task) => {
        const item = document.createElement("li");
        const title = document.createElement("span");
        const due = document.createElement("time");
        title.textContent = task.title;
        due.dateTime = task.dueDate;
        due.textContent = formatLongDate(task.dueDate);
        item.append(title, due);
        return item;
    });
    if (assignmentItems.length === 0) {
        const none = document.createElement("li");
        none.textContent = "No open tasks.";
        assignmentItems.push(none);
    }
    document.getElementById("course-detail-assignments").replaceChildren(...assignmentItems);
}

function createGradeItem(grade) {
    const item = document.createElement("li");
    item.className = "grade-item";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = grade.title;
    meta.textContent = `${capitalize(grade.type)} · ${formatLongDate(grade.date)} · weight ${grade.weight}%`;
    info.append(title, meta);

    const score = document.createElement("span");
    score.className = "grade-score";
    score.textContent = `${grade.score}%`;

    const actions = document.createElement("div");
    actions.className = "course-card-actions";
    actions.append(
        createTextButton("Edit", `Edit grade ${grade.title}`, () => startGradeEdit(grade)),
        createTextButton("Delete", `Delete grade ${grade.title}`, () => deleteGrade(grade), "danger")
    );

    item.append(info, score, actions);
    return item;
}

function resetGradeForm() {
    editingGradeId = null;
    gradeForm.reset();
    clearFormErrors(gradeForm);
    gradeFormTitle.textContent = "Add a grade";
    gradeCancelEdit.hidden = true;
}

function startGradeEdit(grade) {
    resetGradeForm();
    editingGradeId = grade.id;
    gradeFormTitle.textContent = `Edit ${grade.title}`;
    gradeCancelEdit.hidden = false;
    const fields = gradeForm.elements;
    fields.title.value = grade.title;
    fields.type.value = grade.type;
    fields.score.value = grade.score;
    fields.weight.value = grade.weight;
    fields.date.value = grade.date;
    fields.title.focus();
}

gradeCancelEdit.addEventListener("click", resetGradeForm);

// After any grade change: reload grades, then refresh the dialog, the cards and the stats.
async function refreshAfterGradeChange() {
    grades = await apiRequest("GET", "/grades");
    renderCourseDetails();
    renderCourses();
    loadStats();
}

gradeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(gradeForm);

    const clientErrors = checkForm(gradeForm);
    if (clientErrors.length > 0) {
        showFieldErrors(gradeForm, clientErrors);
        return;
    }

    const fields = gradeForm.elements;
    const grade = {
        courseId: detailCourse.id,
        title: fields.title.value,
        type: fields.type.value,
        score: Number(fields.score.value),
        weight: Number(fields.weight.value),
        date: fields.date.value
    };

    const submitButton = gradeForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        if (editingGradeId === null) {
            await apiRequest("POST", "/grades", grade);
        } else {
            await apiRequest("PUT", `/grades/${editingGradeId}`, grade);
        }
        resetGradeForm();
        await refreshAfterGradeChange();
    } catch (error) {
        showSaveError(gradeForm, error);
    } finally {
        submitButton.disabled = false;
    }
});

async function deleteGrade(grade) {
    if (!confirm(`Delete the grade "${grade.title}"?`)) {
        return;
    }
    try {
        await apiRequest("DELETE", `/grades/${grade.id}`);
        if (editingGradeId === grade.id) {
            resetGradeForm();
        }
        await refreshAfterGradeChange();
    } catch (error) {
        setStatus(gradesStatus, "error", `Couldn't delete the grade. ${error.message}`);
    }
}

function openCourseDetails(course, opener) {
    detailCourse = course;
    resetGradeForm();
    renderCourseDetails();
    openDialog(detailDialog, opener);
}

/* ---------- Start ---------- */

async function initCoursesPage() {
    setStatus(coursesStatus, "loading", "Loading courses…");
    loadStats();
    try {
        await loadTasksAndGrades();
    } catch (error) {
        courseGrid.replaceChildren(addCourseCard);
        setStatus(coursesStatus, "error", `Couldn't load courses. ${error.message}`);
        return;
    }
    await loadCourses();
}

initCoursesPage();
