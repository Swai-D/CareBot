import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const { businessId } = verifyToken(req);
    const { id } = params;
    const { question, answer } = await req.json();

    const updated = await prisma.agentFaq.update({
      where: { id, businessId },
      data: { question, answer }
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req, { params }) {
  try {
    const { businessId } = verifyToken(req);
    const { id } = params;

    await prisma.agentFaq.delete({
      where: { id, businessId }
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
