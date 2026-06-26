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
      uriExists: !!process.env.MONGODB_URI,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
    });
  }
}