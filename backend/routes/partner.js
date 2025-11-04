const express = require("express");
const router = express.Router();
const {
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerById,
  getAllPartners,
  getAllListPartners,
} = require("../controllers/partnerController");

// Create a new partner
router.post("/", createPartner);

// Update a partner by ID
router.put("/:id", updatePartner);

// Delete a partner by ID
router.delete("/:id", deletePartner);

// Get a single partner by ID
router.get("/:id", getPartnerById);

// Get all partners with optional filtering
router.get("/", getAllPartners);

// Get all partners without pagination
router.get("/list/all", getAllListPartners);

module.exports = router;
