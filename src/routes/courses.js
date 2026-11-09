const express = require("express");
const controller = require("../controllers/coursesController");

const router = express.Router();

router.get("/", controller.list);
router.get("/stats", controller.stats); // must come before /:id, or "stats" would be read as an id
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.replace);
router.delete("/:id", controller.remove);

module.exports = router;
