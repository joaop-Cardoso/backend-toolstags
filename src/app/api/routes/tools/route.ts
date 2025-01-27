import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../util/validateToken";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authMiddleware } from "../../util/authMiddleware";

const toolsSchema = z.object({
  name: z.string().max(20).min(1),
  tags: z.array(z.number()).optional(), // IDs das tags para associar
});

const createData = async (data: any) => {
  try {
    const upcasedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    // Criação da ferramenta com os relacionamentos intermediários ToolTags
    const createdTool = await prisma.tool.create({
      data: {
        name: upcasedName,
        ToolTags: {
          create: await Promise.all(
            data.tags.map(async (tagId: number) => {
              const tag = await prisma.tag.findUnique({
                where: { id: tagId },
                select: { name: true },
              });

              if (!tag) {
                throw new Error(`Tag ID ${tagId} not found.`);
              }

              return {
                tagId, // Conecta ao ID da Tag
                tagName: tag.name, // Usa o nome da Tag buscado
                toolName: upcasedName, // Usa o nome do Tool
              };
            })
          ),
        },
      },
      include: {
        ToolTags: {
          select: {
            tag: true, // Inclui as Tags relacionadas
          },
        },
      },
    });
    // Formata a resposta para exibir apenas as tags diretamente
    return {
      id: createdTool.id,
      name: createdTool.name,
      tags: createdTool.ToolTags.map(toolTag => toolTag.tag),
    };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Couldnt create new data, a tool with this name already exists")
    }
    throw new Error("Couldn't create new data: " + error.message); // Mensagem com o erro original
  }
};

export async function POST(request: NextRequest) {

  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  const body = await request.json();
  console.log(body)
  const validatedBody = toolsSchema.safeParse(body);
  if (!validatedBody.success) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid request body",
          details:
            "The name property in the JSON must be a string between 1 and 20 characters, and tags (if provided) must be an array of numbers.",
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
export async function GET(request: NextRequest) {

  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const toolsData = await prisma.tool.findMany({
      include: {
        ToolTags: {
          select: {
            tag: true, // Inclui somente as tags
          },
        },
      },
    });

    if (toolsData.length === 0) {
      return NextResponse.json({ success: true, message: "No tools found" });
    }

    const toolsWithTags = toolsData.map(tool => ({
      ...tool,
      tags: tool.ToolTags.length > 0 ? tool.ToolTags.map(toolTag => toolTag.tag) : undefined,
    }));

    const result = toolsWithTags.map(tool => {
      const { ToolTags, ...toolWithoutToolTags } = tool;
      if (!toolWithoutToolTags.tags) {
        delete toolWithoutToolTags.tags;
      }
      return toolWithoutToolTags;
    });

    return NextResponse.json({ success: true, body: result });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}