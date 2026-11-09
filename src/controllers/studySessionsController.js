const store = require("../data/store");
const { validateStudySession } = require("../validators/studySessionsValidator");
const { checkCourseExists } = require("./courseCheck");

const parseId = (req) => Number(req.params.id); // "abc" -> NaN -> matches nothing -> 404

// Body shape (validator) + the course must exist (store).
const validate = (body) => checkCourseExists(validateStudySession(body));

// GET /api/study-sessions
function list(req, res) {
    res.json(store.findAll("studySessions"));
}

// GET /api/study-sessions/:id
function getOne(req, res) {
    const session = store.findById("studySessions", parseId(req));
    if (!session) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(session);
}

// POST /api/study-sessions
function create(req, res) {
    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const session = store.insert("studySessions", value);
    res.status(201).location(`/api/study-sessions/${session.id}`).json(session);
}

// PUT /api/study-sessions/:id   (replaces the whole session)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("studySessions", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("studySessions", id, value));
}

// DELETE /api/study-sessions/:id
function remove(req, res) {
    if (!store.remove("studySessions", parseId(req))) {
        return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
}

module.exports = { list, getOne, create, replace, remove };
