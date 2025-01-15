import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";

const toolsSchema = z.object({
    tools: z.array(
        z.object({
            name: z.string().max(20).min(1),
        })
    ),
});

const createData = async (input: { tools: { name: string }[] }) => {
    try {
        // Validar o input com Zod
        toolsSchema.parse(input);

        // Processar os dados
        const upcasedData = input.tools.map((item) => ({
            ...item,
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        }));

        // Criar os registros no banco
        const createdTags = await prisma.tool.createMany({
            data: upcasedData,
        });

        return createdTags;
    } catch (error: any) {
        throw new Error("Couldn't create new data");
    }
};
export async function POST(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        return NextResponse.json({
            "error": {
                "code": "401",
                "message": "Token not found",
                "details": "The acess token is not set or expired"
            }
        }, { status: 401 })
    }

    const validToken = await validateToken(token)
    if (!validToken) {
        return NextResponse.json({
            "error": {
                "code": "401",
                "message": "User integrity conflict",
                "details": "The current acess token not match the user's granted"
            }
        }, { status: 401 })
    }

    const body = await request.json()
    const validatedBody = toolsSchema.safeParse(body)
    if (!validatedBody.success) {
        return NextResponse.json({
            "error": {
                "code": "400",
                "message": "Invalid request body",
                "details": "The name property in the JSON must be a string between 1 and 20 characters."
            }
        }, { status: 400 })
    }

    const createdData = await createData(body)
    return NextResponse.json({ success: true, body: body });
}
