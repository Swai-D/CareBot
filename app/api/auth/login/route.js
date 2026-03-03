import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // 1. Tafuta User na Business yake
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Email au Password si sahihi" }, { status: 401 });
    }

    // 2. Linganisha Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Email au Password si sahihi" }, { status: 401 });
    }

    // 3. Tengeneza Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      business: user.business ? { id: user.business.id, name: user.business.name } : null
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Imefeli kuingia: " + error.message }, { status: 500 });
  }
}
