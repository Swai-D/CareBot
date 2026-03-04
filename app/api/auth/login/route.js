// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email na password zinahitajika" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        business: {
          select: { id: true, name: true, plan: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email au password si sahihi" },
        { status: 401 }
      );
    }

    // Using 'password' instead of 'passwordHash' to match our current schema
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email au password si sahihi" },
        { status: 401 }
      );
    }

    // ✅ MUHIMU: Weka businessId kwenye token ili routes zote zipate
    // Using helper from lib/auth.js
    const token = signToken({
      userId:     user.id,
      businessId: user.business?.id,   // ← Lazima iwepo hapa
      email:      user.email,
    });

    // Remove password before sending to client
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      token,
      user: safeUser,
      business: user.business,
    });
  } catch (err) {
    console.error("[POST /auth/login]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
