const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const charityController = require("../controllers/charityController");

const router = express.Router();

router.post("/", auth, authorize("admin"), charityController.createCharity);

router.get("/", charityController.getCharities);

router.patch(
  "/:id/resources",
  auth,
  authorize("admin", "charity_admin"),
  charityController.updateCharityResources
);

module.exports = router;
