const express = require("express");
const controller = require("../controllers/usersController");

const router = express.Router();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.replace);
router.delete("/:id", controller.remove);

module.exports = router;
