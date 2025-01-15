import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";


const toolsSchema = z.object({
    name: z.string().max(20).min(1)
});

const createData = async (data: any) => {
    try {
        const upcasedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        const createdTool = await prisma.tool.create({
            data: {
                name: upcasedName
            }
        })

        return createdTool
    } catch (error: any) {
        throw new Error("Couldn't create new data")
    }
}

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
                "details": "The current acess token does not match the user's granted"
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

export async function GET() {
    try {
        const toolsData = await prisma.tool.findMany()
        if (toolsData.length === 0) {
            return NextResponse.json({ success: true, message: 'No tools found' });
        }
        return NextResponse.json({ success: true, body: toolsData })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}