/*Validar o JWT no backend
Para qualquer rota protegida, valide o JWT recebido no cookie:

typescript
Copiar código
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        const payload = jwt.verify(token, secretKey);
        // Se necessário, passe o payload adiante
        request.headers.set('user', JSON.stringify(payload));
        return NextResponse.next();
    } catch (err) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}