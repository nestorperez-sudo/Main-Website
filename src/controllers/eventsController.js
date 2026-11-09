const store = require("../data/store");
const { validateEvent } = require("../validators/eventsValidator");
const { checkCourseExists } = require("./courseCheck");

const parseId = (req) => Number(req.params.id); // "abc" -> NaN -> matches nothing -> 404

// Body shape (validator) + the course must exist if one was given (store).
const validate = (body) => checkCourseExists(validateEvent(body));

// GET /api/events
function list(req, res) {
    res.json(store.findAll("events"));
}

// GET /api/events/:id
function getOne(req, res) {
    const event = store.findById("events", parseId(req));
    if (!event) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(event);
}

// POST /api/events
function create(req, res) {
    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const event = store.insert("events", value);
    res.status(201).location(`/api/events/${event.id}`).json(event);
}

// PUT /api/events/:id   (replaces the whole event)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("events", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validate(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("events", id, value));
}

// DELETE /api/events/:id
function remove(req, res) {
    if (!store.remove("events", parseId(req))) {
        return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
}

module.exports = { list, getOne, create, replace, remove };
