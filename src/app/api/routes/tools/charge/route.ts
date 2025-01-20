import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authMiddleware } from "@/app/api/util/authMiddleware";

const toolsSchema = z.object({
    tools: z.array(
        z.object({
            name: z.string().max(20).min(1),
        })
    ),
});

const createData = async (input: { tools: { name: string }[] }) => {
    try {
        toolsSchema.parse(input);

        const upcasedData = input.tools.map((item) => ({
            ...item,
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
        }));

        const createdTags = await prisma.tool.createMany({
            data: upcasedData,
        });

        return createdTags;
    } catch (error: any) {
        throw new Error("Couldn't create new data");
    }
};
export async function POST(request: NextRequest) {
    
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

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
    return NextResponse.json({ success: true, body: createdData });
}
