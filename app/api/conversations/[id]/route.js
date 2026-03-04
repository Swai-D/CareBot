// app/api/conversations/[id]/route.js
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ── GET /api/conversations/[id] — conversation + messages ────────
export async function GET(request, { params }) {
  try {
    const decoded = verifyToken(request);
    const businessId = decoded.businessId;
    const { id } = params;

    // Ownership check — conversation lazima iwe ya business hii
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        businessId, // ← Security: verify ownership
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Mazungumzo hayapatikani au si yako" },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (err) {
    return handleError(err);
  }
}

// ── PATCH /api/conversations/[id] — update status / human takeover
export async function PATCH(request, { params }) {
  try {
    const decoded = verifyToken(request);
    const businessId = decoded.businessId;
    const { id } = params;
    const body = await request.json();

    // Ownership check
    const existing = await prisma.conversation.findFirst({
      where: { id, businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Hayapatikani au si yako" }, { status: 404 });
    }

    const updateData = {};
    if (body.status) updateData.status = body.status;
    if (body.is_human_handling !== undefined) updateData.isHumanHandling = body.is_human_handling;
    if (body.status === "resolved") updateData.resolvedAt = new Date();

    const updated = await prisma.conversation.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}
