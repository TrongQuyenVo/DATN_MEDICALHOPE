const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const userController = require("../controllers/userController");

const router = express.Router();

router.put("/profile", auth, userController.updateUserProfile);

router.put("/change-password", auth, userController.changePassword);

router.get("/", auth, authorize("admin"), userController.getAllUsers);
router.patch(
  "/:id/suspend",
  auth,
  authorize("admin"),
  userController.suspendUser
);
router.patch(
  "/:id/activate",
  auth,
  authorize("admin"),
  userController.activateUser
);
router.delete("/:id", auth, authorize("admin"), userController.deleteUser);

module.exports = router;
