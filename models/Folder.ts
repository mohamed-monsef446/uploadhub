import mongoose, { Schema, models } from "mongoose";

const FolderSchema = new Schema(
  {
    folderId: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: String,
      default: null,
    },

    capsuleName: {
      type: String,
      default: "Untitled Capsule",
    },

    description: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "📦",
    },

    color: {
      type: String,
      default: "purple",
    },

    filesCount: {
      type: Number,
      default: 0,
    },

    downloads: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    downloadLimit: {
      type: Number,
      default: 0,
    },

    isPasswordProtected: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      default: "",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default models.Folder ||
  mongoose.model("Folder", FolderSchema);