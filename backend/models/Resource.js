const mongoose2 = require("mongoose");

const resourceSchema = new mongoose2.Schema({
  title: String,
  description: String,
  category: String,
  owner: { type: mongoose2.Schema.Types.ObjectId, ref: "User" },
  file: String,
  status: { type: String, enum: ["pending", "available", "requested", "borrowed"], default: "pending" },
  requestedBy: { type: mongoose2.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose2.model("Resource", resourceSchema);