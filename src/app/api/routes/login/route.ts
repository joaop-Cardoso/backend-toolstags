import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { padronizedHash } from "../../util/hash";
import { AnyZodObject, z } from "zod";


const generateJWT = (user: any) => {
    const payload = {
        id: user.id,
        email: user.email,
        creationTime: Math.floor(Date.now() / 1000)
    };

    const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    return token;
};

const validateHash = (salt: string, storedHashedPassword: string, password: string) => {

    const passwordValidate = padronizedHash(password, salt)

    if (storedHashedPassword === passwordValidate) {
        return true
    }
    return false
}

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const sessionRefresh = async (email: string) => {
    const verifySession = await prisma.session.findUnique({
        where: { user: email }
    })
    if (verifySession) {
        const deletedSession = await prisma.session.delete({
            where: {
                user: email,
            },
        })
    }
}
const createSession = async (userEmail: string, token: any) => {
    try {
        const decodedToken = jwt.decode(token);
        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (typeof decodedToken === 'object' && decodedToken !== null && 'iat' in decodedToken && 'exp' in decodedToken) {
            const sessionCreate = await prisma.session.create({
                data: {
                    user: userEmail,
                    acessToken: token,
                    createdAt: new Date(decodedToken.iat! * 1000),
                    ExpirationTime: new Date(decodedToken.exp! * 1000)
                },
            });
            return sessionCreate
        }
    } catch (error: unknown) {
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!request.headers.get('Content-Type')) {
            return new NextResponse(
                JSON.stringify({ error: "The content type for the solicitation must be specified" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        const body = await request.json();
        const { email, password } = body;
        const refreshSession = sessionRefresh(email)

        const parsedBody = LoginSchema.safeParse(body);
        if (!parsedBody.success) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid request body", issues: parsedBody.error.errors }),
                {
                    status: 400, headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return new NextResponse(JSON.stringify({ error: 'User not found' }), {
                status: 404, headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const isPasswordValid = validateHash(user.salt, user.hashedPassword, password);

        if (!isPasswordValid) {
            return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
        }

        const token = generateJWT(user);

        // Configurando o cookie com o token JWT
        const response = new NextResponse(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'User': 'a'
            }
        });

        response.cookies.set('access_token', token, {
            httpOnly: true, // Impede acesso ao cookie via JavaScript (proteção contra XSS)
            secure: process.env.NODE_ENV === 'production', // Apenas HTTPS no ambiente de produção
            sameSite: 'strict', // Previne envio em requisições cross-site (proteção contra CSRF)
            maxAge: 60 * 60// 1 hora
        });

        createSession(user.email, token)

        return response;
    } catch (err) {
        return new NextResponse(JSON.stringify({ error: 'Error during login' }), { status: 500 });

    }
}
