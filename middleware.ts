/*import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    console.log(token)

    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        // Verifica o token JWT
        const payload = jwt.verify(token, secretKey);
        console.log(payload)

        // Armazena o user no cookie
        const response = NextResponse.next();
        response.cookies.set('user', JSON.stringify(payload), { httpOnly: true, maxAge: 60 * 60 });

        return response;
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}

export const config = {
    matcher: ['/api/protected-route'], // Define quais rotas o middleware protege
}; */









/*

import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
    console.log("oieeeeee sou o middleware seu amiguinho")
}

export const config = {
    matcher: ['/api/:path*'], // Inclui todas as rotas dentro de /api
  };*/