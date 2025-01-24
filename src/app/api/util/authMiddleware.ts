import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../util/validateToken";

// Middleware para validar o token
export const authMiddleware = async (request: NextRequest) => {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        error: {
          code: "401",
          message: "Token not found",
          details: "The access token is not set or expired",
        },
      },
      { status: 401 }
    );
  }

  const validToken = await validateToken(token);
  if (!validToken) {
    return NextResponse.json(
      {
        error: {
          code: "401",
          message: "User integrity conflict",
          details:
            "The current access token does not match the user's granted permissions",
        },
      },
      { status: 401 }
    );
  }

  return null; // Retorna null para permitir o próximo código
};