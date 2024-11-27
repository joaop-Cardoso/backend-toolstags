import prisma from "@/lib/prisma";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import { padronizedHash } from "../../util/hash";

const createData = async (data: any) => {
    const saltedHashedPassword = passwordEncrypt(data.password);

    const fullData = await prisma.user.create({
        data: {
            email: data.email,
            salt: saltedHashedPassword.salt,
            hashedPassword: saltedHashedPassword.hashedPassword
        }
    });

    return fullData;
}

const passwordEncrypt = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex'); // Gera um salt
    const hashedPassword = padronizedHash(password, salt);
    
    return { salt, hashedPassword }; // Retorna hash e salt
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json(); // ao invés de request.body pq o Next.js precisa saber de forma explícita que o tipo de data será do tipo JSON, já que existem outros formatos de requisição
        
        if (!body || !body.email || !body.password) {
            return new NextResponse(
                JSON.stringify({ error: 'Email and password are required' }),
                { status: 400 }
            );
        }

        // Verificação zod
        const data = await createData(body);

        return new NextResponse(
            JSON.stringify({ message: 'User created successfully' }),
            { status: 201 }
        );
    } catch (err: any) {
        console.error(err); // Log do erro para debug

        if (err instanceof SyntaxError) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid JSON format' }),
                { status: 400 }
            );
        }

        if (err.name === 'PrismaClientKnownRequestError') {
            if (err.code === 'P2002') {
                return new NextResponse(
                    JSON.stringify({ error: 'User with this email already exists' }),
                    { status: 409 }
                );
            }
        }

        return new NextResponse(
            JSON.stringify({ error: 'An unexpected error occurred during user creation' }),
            { status: 500 }
        );
    }
}
