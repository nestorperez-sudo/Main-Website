const store = require("../data/store");
const { validateUser } = require("../validators/usersValidator");

const parseId = (req) => Number(req.params.id); // "abc" -> NaN -> matches nothing -> 404

// GET /api/users
function list(req, res) {
    res.json(store.findAll("users"));
}

// GET /api/users/:id
function getOne(req, res) {
    const user = store.findById("users", parseId(req));
    if (!user) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(user);
}

// POST /api/users   (used by the sign-up form)
function create(req, res) {
    const { valid, errors, value } = validateUser(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    const user = store.insert("users", value);
    res.status(201).location(`/api/users/${user.id}`).json(user);
}

// PUT /api/users/:id   (replaces the whole user; used by Save changes in settings)
function replace(req, res) {
    const id = parseId(req);
    if (!store.findById("users", id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const { valid, errors, value } = validateUser(req.body);
    if (!valid) {
        return res.status(400).json({ errors });
    }

    res.json(store.replace("users", id, value));
}

// DELETE /api/users/:id   (used by Delete account in settings)
function remove(req, res) {
    if (!store.remove("users", parseId(req))) {
        return res.status(404).json({ error: "Not found" });
    }
    res.status(204).end();
}

module.exports = { list, getOne, create, replace, remove };
