import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authMiddleware } from "../../util/authMiddleware";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function DELETE(request: NextRequest) {
  // Middleware de autenticação
  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const token = request.cookies.get("access_token")?.value as string;

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Invalid SecretKey");
    }

    let payload: JwtPayload | null = null;
    try {
      payload = jwt.verify(token, secretKey) as JwtPayload;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { email } = payload;
    if (!email) {
      return NextResponse.json(
        { error: "Email not found in token payload" },
        { status: 400 }
      );
    }

    console.log(email);
    console.log(token);

    const deletedSession = await prisma.session.delete({
      where: {
        user: email,
        acessToken: token,
      },
    });
    const response = NextResponse.json({
        success: true,
        message: "Session deleted, token removed",
      });
  
      response.cookies.set("access_token", "", {
        httpOnly: true,
        secure: true,
        path: "/",
        expires: new Date(0),
      });
  
      return response;
  } catch (error: any) {
    console.error("Error in DELETE handler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}