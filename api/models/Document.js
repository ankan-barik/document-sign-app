const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "signed", "completed"],
      default: "draft",
    },
    signers: [
      {
        email: {
          type: String,
          required: true,
        },
        name: String,
        status: {
          type: String,
          enum: ["pending", "signed", "declined"],
          default: "pending",
        },
        signedAt: Date,
        signatureData: {
          x: Number,
          y: Number,
          page: Number,
          width: Number,
          height: Number,
        },
      },
    ],
    signatureToken: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Document", documentSchema)
