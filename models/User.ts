import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plan: { type: String, default: "free" },
    uploadsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", UserSchema);