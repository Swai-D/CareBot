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
      where: { id: decoded.userId }
    });
  } catch { return null; }
}

export async function PATCH(req, { params }) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const { question, answer } = await req.json();

  try {
    const updated = await prisma.faq.update({
      where: { id, businessId: user.businessId },
      data: { question, answer }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getAuthUser(req);
  if (!user || !user.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  try {
    await prisma.faq.delete({
      where: { id, businessId: user.businessId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }
}
