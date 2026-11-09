/*
 * Logs one line per request once the response has been sent, e.g.
 *   GET /api/courses 200 3ms
 * Waiting for "finish" lets us include the final status code.
 */
function logger(req, res, next) {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });

    next();
}

module.exports = logger;
