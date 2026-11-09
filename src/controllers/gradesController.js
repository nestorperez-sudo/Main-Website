const store = require("../data/store");
const { validateGrade } = require("../validators/gradesValidator");
const { checkCourseExists } = require("./courseCheck");

const parseId = (req) => Number(req.params.id); // "abc" -> NaN -> matches nothing -> 404

// Body shape (validator) + the course must exist (store).
const validate = (body) => checkCourseExists(validateGrade(body));

// GET /api/grades
function list(req, res) {
    res.json(store.findAll("grades"));
}

// GET /api/grades/:id
function getOne(req, res) {
    const grade = store.findById("grades", parseId(req));
    if (!grade) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(grade);
}

// POST /api/grades
function create(req, res) {
    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const grade = store.insert("grades", value);
    res.status(201).location(`/api/grades/${grade.id}`).json(grade);
}

// PUT /api/grades/:id   (replaces the whole grade)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("grades", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("grades", id, value));
}

// DELETE /api/grades/:id
function remove(req, res) {
    if (!store.remove("grades", parseId(req))) {
        return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
}

module.exports = { list, getOne, create, replace, remove };
