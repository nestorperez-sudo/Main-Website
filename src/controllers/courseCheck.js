const store = require("../data/store");

/*
 * Validators only check the shape of courseId (a whole number). Whether that
 * course exists depends on the stored data, so controllers check it here and
 * add the problem to the same error list, keeping "all errors at once".
 */
function checkCourseExists(result) {
    const { courseId } = result.value;

    // Skip when courseId is missing/null (optional) or already failed its own check.
    if (courseId !== undefined && courseId !== null && !store.findById("courses", courseId)) {
        result.errors.push({ field: "courseId", message: "No course with this id." });
        result.valid = false;
    }
    return result;
}

module.exports = { checkCourseExists };
