
const express = require("express");
const Request = require("../models/Request");
const Donation = require("../models/Donation");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE A FOOD REQUEST
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "receiver") {
      return res.status(403).json({
        message: "Only receivers can request food",
      });
    }

    const { donationId, quantityRequested, message } = req.body;
    const quantity = Number(quantityRequested);

    if (
      !donationId ||
      quantityRequested === undefined ||
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "A valid donation ID and quantity are required",
      });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (
      donation.status !== "available" ||
      donation.expiryDate <= new Date()
    ) {
      return res.status(400).json({
        message: "This donation is no longer available",
      });
    }

    if (quantity > donation.quantity) {
      return res.status(400).json({
        message: "Requested quantity exceeds available quantity",
      });
    }

    if (donation.donor.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot request your own donation",
      });
    }

    const foodRequest = await Request.create({
      donation: donation._id,
      receiver: req.user._id,
      quantityRequested: quantity,
      message,
    });

    res.status(201).json({
      message: "Food request submitted successfully",
      request: foodRequest,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid donation ID",
      });
    }

    console.error("Create request error:", error.message);
    res.status(500).json({
      message: "Server error while creating request",
    });
  }
});

// VIEW MY REQUESTS (RECEIVER)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "receiver") {
      return res.status(403).json({
        message: "Only receivers can view their requests",
      });
    }

    const requests = await Request.find({
      receiver: req.user._id,
    })
      .populate("donation")
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get requests error:", error.message);
    res.status(500).json({
      message: "Server error while fetching requests",
    });
  }
});

// VIEW REQUESTS FOR MY DONATIONS (DONOR)
router.get("/received", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        message: "Only donors can view received requests",
      });
    }

    const donations = await Donation.find({
      donor: req.user._id,
    }).select("_id");

    const donationIds = donations.map((item) => item._id);

    const requests = await Request.find({
      donation: { $in: donationIds },
    })
      .populate("donation")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get received requests error:", error.message);
    res.status(500).json({
      message: "Server error while fetching received requests",
    });
  }
});


 // APPROVE OR REJECT A REQUEST (DONOR)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        message: "Only donors can update request status",
      });
    }

    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const foodRequest = await Request.findById(req.params.id);

    if (!foodRequest) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const donation = await Donation.findById(foodRequest.donation);

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only manage requests for your own donations",
      });
    }

    if (foodRequest.status !== "pending") {
      return res.status(400).json({
        message: "Only pending requests can be updated",
      });
    }

    if (status === "approved") {
      if (
        donation.status !== "available" ||
        donation.expiryDate <= new Date() ||
        foodRequest.quantityRequested > donation.quantity
      ) {
        return res.status(400).json({
          message: "Not enough available food to approve this request",
        });
      }

      const remainingQuantity =
        donation.quantity - foodRequest.quantityRequested;

      if (remainingQuantity === 0) {
        // Mark the donation as claimed without saving quantity = 0,
        // because the Donation model requires quantity >= 1.
        await Donation.findByIdAndUpdate(donation._id, {
          $set: { status: "claimed" },
        });
      } else {
        donation.quantity = remainingQuantity;
        await donation.save();
      }
    }

    foodRequest.status = status;
    await foodRequest.save();

    res.json({
      message: `Request ${status} successfully`,
      request: foodRequest,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid request ID",
      });
    }

    console.error("Update request error:", error);
    res.status(500).json({
      message: "Server error while updating request",
    });
  }
});

module.exports = router;
