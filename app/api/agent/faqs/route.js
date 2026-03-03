import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET || "carebot_secret_key_2026";

async function getAuthUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true }
    });
  } catch { return null; }
}

export async function GET(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faqs = await prisma.faq.findMany({
    where: { businessId: user.businessId }
  });

  return NextResponse.json(faqs);
}

export async function POST(req) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, answer } = await req.json();

  const faq = await prisma.faq.create({
    data: {
      question,
      answer,
      businessId: user.businessId
    }
  });

  return NextResponse.json(faq);
}
