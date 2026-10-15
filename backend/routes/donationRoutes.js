
const express = require("express");
const Donation = require("../models/Donation");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE A DONATION
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        message: "Only donors can create food donations",
      });
    }

    const {
      foodName,
      description,
      quantity,
      unit,
      pickupLocation,
      expiryDate,
    } = req.body;

    if (!foodName || !quantity || !pickupLocation || !expiryDate) {
      return res.status(400).json({
        message: "Food name, quantity, pickup location, and expiry date are required",
      });
    }

    if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        message: "Quantity must be a number greater than or equal to 1",
      });
    }

    if (new Date(expiryDate) <= new Date()) {
      return res.status(400).json({
        message: "Expiry date must be in the future",
      });
    }

    const donation = await Donation.create({
      foodName,
      description,
      quantity,
      unit,
      pickupLocation,
      expiryDate,
      donor: req.user._id,
    });

    res.status(201).json({
      message: "Food donation created successfully",
      donation,
    });
  } catch (error) {
    console.error("Create donation error:", error.message);
    res.status(500).json({
      message: "Server error while creating donation",
    });
  }
});

// GET ALL AVAILABLE DONATIONS
router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: "available",
      expiryDate: { $gt: new Date() },
    })
      .populate("donor", "name")
      .sort({ createdAt: -1 });

    res.json({
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Get donations error:", error.message);
    res.status(500).json({
      message: "Server error while fetching donations",
    });
  }
});

// GET MY DONATIONS
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const donations = await Donation.find({
      donor: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Get my donations error:", error.message);
    res.status(500).json({
      message: "Server error while fetching your donations",
    });
  }
});

// DELETE MY DONATION
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (
      donation.donor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You can only delete your own donations",
      });
    }

    await donation.deleteOne();

    res.json({
      message: "Donation deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid donation ID",
      });
    }

    console.error("Delete donation error:", error.message);
    res.status(500).json({
      message: "Server error while deleting donation",
    });
  }
});

module.exports = router;
