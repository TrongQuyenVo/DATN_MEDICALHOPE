// controllers/charityController.js
const CharityOrg = require("../models/CharityOrg");

// Create charity organization
exports.createCharity = async (req, res) => {
  try {
    const charity = new CharityOrg(req.body);
    await charity.save();

    res.status(201).json({
      success: true,
      message: "Charity organization created successfully",
      charity,
    });
  } catch (error) {
    console.error("Create charity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all charity organizations
exports.getCharities = async (req, res) => {
  try {
    const { isActive, limit = 10, page = 1 } = req.query;
    let query = {};

    if (isActive !== undefined) query.isActive = isActive === "true";

    const charities = await CharityOrg.find(query)
      .populate("adminUserIds", "fullName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CharityOrg.countDocuments(query);

    res.json({
      success: true,
      charities,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get charities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update charity resources
exports.updateCharityResources = async (req, res) => {
  try {
    const charity = await CharityOrg.findByIdAndUpdate(
      req.params.id,
      { resources: req.body },
      { new: true, runValidators: true }
    );

    if (!charity) {
      return res.status(404).json({
        success: false,
        message: "Charity organization not found",
      });
    }

    res.json({
      success: true,
      message: "Charity resources updated successfully",
      charity,
    });
  } catch (error) {
    console.error("Update charity resources error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
