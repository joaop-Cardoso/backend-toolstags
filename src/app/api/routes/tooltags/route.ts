import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const toolTagsSchema = z.object({
    toolId: z.number().min(1).max(99999).positive(),
    tagId: z.number().min(1).max(99999).positive()
});

const updateDataSchema = z.object({
    externalId: z.number().int().positive(),
    toolId: z.number().int().positive(),
    tagId: z.number().int().positive(),
});

const validateIdsExistence = async (toolId: number, tagId: number) => {
    const toolExists = await prisma.tool.findUnique({
        where: { id: toolId },
    });
    if (!toolExists) {
        return { success: false, message: "Tool not found" };
    }

    const tagExists = await prisma.tag.findUnique({
        where: { id: tagId },
    });
    if (!tagExists) {
        return { success: false, message: "Tag not found" };
    }

    return { success: true };
};

const createData = async (data: any) => {
    const validation = await validateIdsExistence(data.toolId, data.tagId);
    if (!validation.success) {
        return { success: false, message: validation.message };
    }

    try {

        const tool = await prisma.tool.findUnique(
            {
                where: {
                    id: data.toolId
                }
            }
        )
        const toolName = tool?.name as string

        const tag = await prisma.tag.findUnique(
            {
                where: {
                    id: data.tagId
                }
            }
        )
        const tagName = tag?.name as string

        const createdToolTag = await prisma.toolTags.create({
            data: {
                toolId: data.toolId,
                tagId: data.tagId,
                toolName: toolName,
                tagName: tagName
            },
        });

        return { success: true, data: createdToolTag };
    } catch (error: any) {
        return { success: false, message: error.message || "Couldn't create new data" };
    }
};

const updateData = async (jsonId: number, jsonToolId: number, jsonTagId: number) => {

    const verified = prisma.toolTags.findUnique({
        where: {
            id: jsonId,
        }
    })
    if (!verified) {
        throw new Error(`No record found with id: ${jsonId}`);
    }

    const tool = await prisma.tool.findUnique(
        {
            where: {
                id: jsonToolId
            }
        }
    )
    const jsonToolName = tool?.name as string

    const tag = await prisma.tag.findUnique(
        {
            where: {
                id: jsonTagId
            }
        }
    )
    const jsonTagName = tag?.name as string

    const updated = prisma.toolTags.update({
        where: {
            id: jsonId
        },
        data: {
            toolId: jsonToolId,
            tagId: jsonTagId,
            toolName:jsonToolName,
            tagName:jsonTagName
        }
    })
    return updated
}

export async function POST(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        return NextResponse.json({
            "error": {
                "code": "401",
                "message": "Token not found",
                "details": "The access token is not set or expired"
            }
        }, { status: 401 });
    }

    const validToken = await validateToken(token);
    if (!validToken) {
        return NextResponse.json({
            "error": {
                "code": "401",
                "message": "User integrity conflict",
                "details": "The current access token does not match the user's granted"
            }
        }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = toolTagsSchema.safeParse(body);
    if (!validatedBody.success) {
        return NextResponse.json({
            "error": {
                "code": "400",
                "message": "Invalid request body",
                "details": "toolId or tagId must be a number between 1 and 20 characters."
            }
        }, { status: 400 });
    }

    const createdData = await createData(body);
    if (!createdData.success) {
        return NextResponse.json({
            "error": {
                "code": "404",
                "message": createdData.message || "Error while creating ToolTag",
                "details": createdData.message || "Tool or Tag not found"
            }
        }, { status: 404 });
    }

    return NextResponse.json({ success: true, body: createdData.data });
}

export async function GET() {
    try {
        const tooltagsData = await prisma.toolTags.findMany();
        if (tooltagsData.length === 0) {
            return NextResponse.json({ success: true, message: 'No relationships found' });
        }
        return NextResponse.json({ success: true, body: tooltagsData });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, toolId, tagId } = body
        const validatedParams = updateDataSchema.safeParse({ id, toolId, tagId });
        if (!validatedParams) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "400",
                        message: "Invalid parameters.",
                        details: "All IDs must be positive integers.",
                    },
                },
                { status: 400 }
            );
        }

        const updateResult = await updateData(id, toolId, tagId);

        return NextResponse.json({ success: true, data: updateResult }, { status: 200 });

    } catch (error: any) {

        return NextResponse.json(
            { success: false, error: { code: "500", message: "Internal server error"} },
            { status: 500 }
        );
    }
}

export async function DELETE (request: NextRequest)
{
    const body = await request.json()
    const ToolTags = await prisma.toolTags.delete({
        where: {
            id:body.id
        }
      })
    return NextResponse.json({success: false, ToolTags})
}