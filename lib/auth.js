// lib/auth.js
// ✅ Helper moja ya auth — itumie kwenye KILA API route
// Inaepuka JWT secret mismatch

import jwt from "jsonwebtoken";

// SECRET MOJA kwa app yote
export const JWT_SECRET = process.env.JWT_SECRET || "carebot_jwt_secret_2026";

/**
 * Verify JWT token kutoka request header
 * @returns {{ userId, businessId, email }} decoded payload
 * @throws Error kama token ni batili
 */
export function verifyToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    throw Object.assign(new Error("Token haikupatikana"), { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.businessId) {
      throw Object.assign(
        new Error("Token haina businessId — login tena"),
        { status: 401 }
      );
    }

    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw Object.assign(new Error("Token imeisha muda — login tena"), { status: 401 });
    }
    if (err.name === "JsonWebTokenError") {
      throw Object.assign(new Error("Token batili"), { status: 401 });
    }
    throw err;
  }
}

/**
 * Tengeneza token mpya
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Error handler ya kawaida kwa API routes
 */
export function handleError(err) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  console.error(`[API Error ${status}]:`, message);
  return Response.json({ error: message }, { status });
}
