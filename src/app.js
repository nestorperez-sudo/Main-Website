const path = require("path");
const express = require("express");
const logger = require("./middleware/logger");
const coursesRouter = require("./routes/courses");

const app = express();

// 1. Log every request (first, so even rejected requests appear in the log).
app.use(logger);

// 2. Parse JSON request bodies into req.body.
app.use(express.json());

// 3. Serve the front end: /index.html, /styles.css, /js/main.js ...
//    Mounted before the API routers; the pages and /api never share a path.
app.use(express.static(path.join(__dirname, "..", "public")));

// 4. API routers, one per resource, all under /api/<resource>.
app.use("/api/courses", coursesRouter);

// 5. Anything not matched above: JSON 404.
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// 6. Error handler: registered LAST. Always JSON, never a stack trace.
//    Express recognises it as an error handler because it takes 4 arguments.
app.use((err, req, res, next) => {
    // express.json() throws this when the body is not valid JSON.
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            errors: [{ field: "body", message: "Request body must be valid JSON." }]
        });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
