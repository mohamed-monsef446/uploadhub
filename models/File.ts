import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  fileName: {
    type: String,
    required: true
  },

  fileSize: {
    type: Number,
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  downloads: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

export default mongoose.models.File ||
mongoose.model("File", FileSchema);