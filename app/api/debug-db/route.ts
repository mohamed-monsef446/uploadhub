import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      dbName: mongoose.connection.db?.databaseName,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
      mongoUriStartsWith: process.env.MONGODB_URI?.slice(0, 45),
      mongoUriIncludesUploadhub: process.env.MONGODB_URI?.includes("/uploadhub"),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      mongoUriStartsWith: process.env.MONGODB_URI?.slice(0, 45),
    });
  }
}