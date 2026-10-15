
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    foodName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit: {
      type: String,
      enum: ["servings", "kg", "packets", "boxes"],
      default: "servings",
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "requested", "claimed", "expired"],
      default: "available",
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Donation", donationSchema);
