const mongoose = require("mongoose");

const usefulLinkSchema = new mongoose.Schema(
{
title: {
type: String,
required: true,
trim: true,
},
url: {
type: String,
required: true,
},
assignedTo: [
{
type: mongoose.Schema.Types.ObjectId,
ref: "User",
},
],
createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},
},
{ timestamps: true }
);

module.exports = mongoose.model("UsefulLink", usefulLinkSchema);
