// app/api/agent/faqs/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken, handleError } from "@/lib/auth";

export async function GET(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;

    const faqs = await prisma.agentFaq.findMany({
      where: { businessId },
      orderBy: { priority: "desc" }
    });

    return NextResponse.json(faqs);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req) {
  try {
    const decoded = verifyToken(req);
    const businessId = decoded.businessId;

    const { question, answer } = await req.json();

    const faq = await prisma.agentFaq.create({
      data: {
        question,
        answer,
        businessId
      }
    });

    return NextResponse.json(faq);
  } catch (err) {
    return handleError(err);
  }
}
