import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("-----------------------------------------");
  console.log("API: Mchakato wa Usajili umeanza...");
  
  try {
    const body = await req.json();
    const { email, password, name, businessName } = body;

    console.log("API: Data inayopokelewa:", { email, name, businessName });

    // 1. Jaribu connection ya Prisma
    console.log("API: Inajaribu kuongea na Database...");
    
    // 2. Check kama email ipo tayari
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("API: Email ipo tayari!");
      return NextResponse.json({ error: "Email tayari inatumika" }, { status: 400 });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create Business na User kwa pamoja
    console.log("API: Inatengeneza Business na User...");
    const business = await prisma.business.create({
      data: {
        name: businessName,
        users: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: "ADMIN"
          }
        }
      },
      include: {
        users: true
      }
    });

    const user = business.users[0];

    // 5. Tengeneza Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "carebot_secret_key_2026",
      { expiresIn: "7d" }
    );

    console.log("API: Usajili umefanikiwa!");
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      business: { id: business.id, name: business.name }
    });

  } catch (error) {
    // Tuma error halisi kwenye terminal
    console.error("CRITICAL ERROR KATIKA API:", error);
    
    // Rudisha error kama JSON badala ya HTML
    return NextResponse.json({ 
      error: "Error: " + error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
