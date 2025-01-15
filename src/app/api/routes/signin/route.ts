import prisma from "@/lib/prisma";
import { error, log } from "console";
import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import { padronizedHash } from "../../util/hash";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";

const createData = async (data: any) => {
    try {
        const saltedHashedPassword = passwordEncrypt(data.password);
        const fullData = await prisma.user.create({
            data: {
                email: data.email,
                salt: saltedHashedPassword.salt,
                hashedPassword: saltedHashedPassword.hashedPassword
            }
        });
        if (fullData)
            return fullData
    } catch (error: unknown) {
        throw error
    }
}

const passwordEncrypt = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex'); // Gera um salt
    const hashedPassword = padronizedHash(password, salt);

    return { salt, hashedPassword }; // Retorna hash e salt
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json(); // ao invés de request.body pq o Next.js precisa saber de forma explícita que o tipo de data será do tipo JSON, já que existem outros formatos de requisição
        if (!body || typeof body === 'string' || Array.isArray(body)) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid JSON format: Must be a JSON object' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (!body || !body.email || !body.password) {
            return new NextResponse(
                JSON.stringify({ error: 'Email and password are required' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        const userSchema = z.object({
            email: z.string().email({ message: "Invalid email format" }),
            password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
        });

        const parsedBody = userSchema.parse(body);
        const data = await createData(body);

        return new NextResponse(
            JSON.stringify({ message: 'User created successfully' }),
            {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (err: unknown) {

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {

                return new NextResponse(
                    JSON.stringify({ error: 'User with this email already exists' }),
                    {
                        status: 409,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }
        }

        if (err instanceof ZodError) {
            console.log(err.issues)
            if(err.issues[0].code === "invalid_string")
            {
                return new NextResponse(
                    JSON.stringify({error: 'Invalid email format'}),{
                        status:400
                    }
                )
            }
            if(err.issues[0].code === "too_small")
                {
                    return new NextResponse(
                        JSON.stringify({error: 'Password must be at least 6 characters long'}),{
                            status:400,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                }
        }
    }

    return new NextResponse(
        JSON.stringify({ error: 'An unexpected error occurred during user creation'}),
        {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
}

