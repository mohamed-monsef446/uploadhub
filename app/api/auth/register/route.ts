import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: "All fields are required",
      });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      plan: "free",
      uploadsCount: 0,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Registration failed",
      error: String(error),
    });
  }
}