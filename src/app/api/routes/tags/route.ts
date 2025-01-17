import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";

const tagsSchema = z.object({
  name: z.string().max(20).min(1),
  tools: z.array(z.number()).optional(), // IDs das ferramentas para associar
});

const createData = async (data: any) => {
  try {
    const upcasedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    // Criação da tag com os relacionamentos intermediários ToolTags
    const createdTag = await prisma.tag.create({
      data: {
        name: upcasedName,
        ToolTags: data.tools
          ? {
              create: data.tools.map((toolId: number) => ({
                tool: { connect: { id: toolId } },
              })),
            }
          : undefined,
      },
      include: {
        ToolTags: {
          select: {
            tool: true, // Inclui apenas as ferramentas relacionadas
          },
        },
      },
    });

    // Formata a resposta para exibir apenas as ferramentas diretamente
    return {
      id: createdTag.id,
      name: createdTag.name,
      tools: createdTag.ToolTags.map(toolTag => toolTag.tool),
    };
  } catch (error: any) {
    throw new Error("Couldn't create new data");
  }
};

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        error: {
          code: "401",
          message: "Token not found",
          details: "The access token is not set or expired",
        },
      },
      { status: 401 }
    );
  }

  const validToken = await validateToken(token);
  if (!validToken) {
    return NextResponse.json(
      {
        error: {
          code: "401",
          message: "User integrity conflict",
          details:
            "The current access token does not match the user's granted permissions",
        },
      },
      { status: 401 }
    );
  }

  const body = await request.json();
  const validatedBody = tagsSchema.safeParse(body);
  if (!validatedBody.success) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid request body",
          details:
            "The name property in the JSON must be a string between 1 and 20 characters, and tools (if provided) must be an array of numbers.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const createdData = await createData(validatedBody.data);
    return NextResponse.json({ success: true, body: createdData });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "500",
          message: "Internal server error",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
        const tagsData = await prisma.tag.findMany({
            include: {
                ToolTags: {
                    select: { 
                        tool: true // Inclui somente as ferramentas
                    }
                }
            }
        });

        if (tagsData.length === 0) {
            return NextResponse.json({ success: true, message: 'No tags found' });
        }

        // Formata os dados para incluir as ferramentas diretamente no resultado
        const tagsWithTools = tagsData.map(tag => ({
            ...tag,
            tools: tag.ToolTags.length > 0 ? tag.ToolTags.map(toolTag => toolTag.tool) : undefined // Incluir ferramentas somente se houver
        }));

        // Filtra para remover a chave 'tools' se não houver ferramentas associadas
        const result = tagsWithTools.map(tag => {
            const { ToolTags, ...tagWithoutToolTags } = tag;
            if (!tagWithoutToolTags.tools) {
                delete tagWithoutToolTags.tools; // Remove a chave 'tools' se estiver vazia
            }
            return tagWithoutToolTags;
        });

        return NextResponse.json({ success: true, body: result });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}