const store = require("../data/store");
const { validateTask } = require("../validators/tasksValidator");
const { checkCourseExists } = require("./courseCheck");

const parseId = (req) => Number(req.params.id); // "abc" -> NaN -> matches nothing -> 404

// Body shape (validator) + the course must exist (store).
const validate = (body) => checkCourseExists(validateTask(body));

// GET /api/tasks
function list(req, res) {
    res.json(store.findAll("tasks"));
}

// GET /api/tasks/:id
function getOne(req, res) {
    const task = store.findById("tasks", parseId(req));
    if (!task) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(task);
}

// POST /api/tasks
function create(req, res) {
    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const task = store.insert("tasks", value);
    res.status(201).location(`/api/tasks/${task.id}`).json(task);
}

// PUT /api/tasks/:id   (replaces the whole task)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("tasks", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("tasks", id, value));
}

// DELETE /api/tasks/:id
function remove(req, res) {
    if (!store.remove("tasks", parseId(req))) {
        return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
}

module.exports = { list, getOne, create, replace, remove };
