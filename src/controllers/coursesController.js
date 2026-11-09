const store = require("../data/store");
const { validateCourse, validateCourseQuery, SEMESTERS } = require("../validators/coursesValidator");

// Resources that point to a course through courseId; deleted along with it.
const COURSE_CHILDREN = ["tasks", "events", "studySessions", "grades"];

// "7" -> 7. Anything that isn't a whole number becomes NaN, which matches no
// course, so /api/courses/abc simply returns 404.
const parseId = (req) => Number(req.params.id);

// GET /api/courses?search=&semester=&archived=   (filters combine)
function list(req, res) {
    const { valid, errors, filters } = validateCourseQuery(req.query);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    let courses = store.findAll("courses");

    if (filters.search) {
        const term = filters.search.toLowerCase();
        courses = courses.filter(
            (course) => course.name.toLowerCase().includes(term) || course.code.toLowerCase().includes(term)
        );
    }
    if (filters.semester) {
        courses = courses.filter((course) => course.semester === filters.semester);
    }
    if (filters.archived !== undefined) {
        courses = courses.filter((course) => course.archived === filters.archived);
    }

    res.json(courses);
}

// GET /api/courses/stats   (computed on every request, never stored)
function stats(req, res) {
    const courses = store.findAll("courses");
    const grades = store.findAll("grades");

    const archived = courses.filter((course) => course.archived).length;
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

    const bySemester = {};
    SEMESTERS.forEach((semester) => {
        bySemester[semester] = courses.filter((course) => course.semester === semester).length;
    });

    // Average of every grade score, rounded to one decimal; null when there are no grades.
    const averageGrade = grades.length === 0
        ? null
        : Math.round((grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) * 10) / 10;

    res.json({
        total: courses.length,
        active: courses.length - archived,
        archived,
        totalCredits,
        averageGrade,
        bySemester
    });
}

// GET /api/courses/:id
function getOne(req, res) {
    const course = store.findById("courses", parseId(req));
    if (!course) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(course);
}

// POST /api/courses
function create(req, res) {
    const { valid, errors, value } = validateCourse(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const course = store.insert("courses", value);
    res.status(201).location(`/api/courses/${course.id}`).json(course);
}

// PUT /api/courses/:id   (replaces the whole course)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("courses", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validateCourse(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("courses", id, value));
}

// DELETE /api/courses/:id   (also deletes everything linked to the course)
function remove(req, res) {
    const id = parseId(req);
    if (!store.remove("courses", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    COURSE_CHILDREN.forEach((collection) => store.removeWhere(collection, "courseId", id));
    res.status(204).end();
}

module.exports = { list, stats, getOne, create, replace, remove };
