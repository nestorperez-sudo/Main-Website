/*
 * apiRequest(): the ONE place in the front end that calls fetch().
 *
 *   const courses = await apiRequest("GET", "/courses?archived=false");
 *   const task = await apiRequest("POST", "/tasks", { title: "...", ... });
 *
 * Resolves with the parsed JSON body (null for 204 No Content).
 * Rejects with an ApiError when the server can't be reached or answers with
 * an error status. fetch() itself does NOT reject on 404 or 500, so we check
 * response.ok ourselves.
 */

class ApiError extends Error {
    constructor(message, status, errors = []) {
        super(message);
        this.status = status; // 0 when the server could not be reached
        this.errors = errors; // [{ field, message }] from a 400 response
    }
}

async function apiRequest(method, path, body) {
    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`/api${path}`, options);
    } catch {
        throw new ApiError("Could not reach the server. Is it running?", 0);
    }

    // Our API always answers JSON (or nothing, for 204). Anything else means the
    // page is being served by something other than our Express server.
    const text = await response.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new ApiError("Unexpected answer from the server. Open the site with npm start at http://localhost:3000.", response.status);
        }
    }

    if (!response.ok) {
        const message = response.status === 400
            ? "Please fix the highlighted fields."
            : data?.error ?? `Request failed (${response.status}).`;
        throw new ApiError(message, response.status, data?.errors ?? []);
    }

    return data;
}
