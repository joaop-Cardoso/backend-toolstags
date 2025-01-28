import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authMiddleware } from "@/app/api/util/authMiddleware";

const getData = async (ExternalId: number) => {
  const tool = await prisma.tool.findUnique({
    where: { id: ExternalId },
    include: {
      ToolTags: {
        select: {
          tag: true, // Inclui as tags relacionadas
        },
      },
    },
  });

  if (!tool) {
    throw new Error(`Tool with id ${ExternalId} not found.`);
  }

  // Formata os dados para incluir as tags diretamente no resultado
  const formattedTool = {
    id: tool.id,
    name: tool.name,
    tags: tool.ToolTags.length > 0 ? tool.ToolTags.map(toolTag => toolTag.tag) : undefined, // Inclui tags somente se houver
  };

  // Remove a chave 'tags' se não houver tags associadas
  if (!formattedTool.tags) {
    delete formattedTool.tags;
  }

  return formattedTool;
};

export async function GET(request: NextRequest) {

  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid ID",
          details: "The ID parameter must be a valid number.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const data = await getData(idNumber);
    return NextResponse.json({ success: true, body: data });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "404",
          message: error.message,
          details: "Could not find the requested resource.",
        },
      },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid ID",
          details: "The ID parameter must be a valid number.",
        },
      },
      { status: 400 }
    );
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid data",
          details: "The 'name' field is required and must be a string.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const existingTool = await prisma.tool.findUnique({ where: { id: idNumber } });

    if (!existingTool) {
      return NextResponse.json(
        {
          error: {
            code: "404",
            message: `Tool with id ${idNumber} not found.`,
            details: "Could not find the requested resource.",
          },
        },
        { status: 404 }
      );
    }

    // Atualiza a ferramenta com o novo nome
    const updatedTool = await prisma.tool.update({
      where: { id: idNumber },
      data: { name: body.name },
    });

    if (!body.tags) {
      return NextResponse.json({ data: updatedTool });
    }

    if (Array.isArray(body.tags)) {
      // Remove as associações antigas de ToolTags
      await prisma.toolTags.deleteMany({
        where: { toolId: idNumber },
      });

      // Recria as novas associações com as tags fornecidas
      const newToolTags = [];
      for (const tagId of body.tags) {
        const tag = await prisma.tag.findUnique({ where: { id: tagId } });
        if (!tag) continue; // Ignora tags inválidas

        // Cria nova associação
        const newTagAssociation = await prisma.toolTags.create({
          data: {
            toolId: idNumber,
            tagId,
            toolName: existingTool.name, // Usa o nome da ferramenta já existente
            tagName: tag.name, // Usa o nome da tag
          },
        });

        newToolTags.push(newTagAssociation); // Armazena a nova associação
      }

      // Busca todas as tags associadas à ferramenta
      const updatedTags = await prisma.toolTags.findMany({
        where: { toolId: idNumber },
        include: { tag: true }, // Inclui os dados da tag
      });

      return NextResponse.json({
        data: {
          tool: updatedTool,
          tags: updatedTags.map((toolTag) => toolTag.tag), // Retorna as tags associadas
        },
      });
    }

    return NextResponse.json({ data: updatedTool });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "500",
          message: "Internal Server Error",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {

  const authResponse = await authMiddleware(request);
  if (authResponse) return authResponse;

  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "Invalid ID",
          details: "The ID parameter must be a valid number.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const existingTool = await prisma.tool.findUnique({ where: { id: idNumber } });

    if (!existingTool) {
      return NextResponse.json(
        {
          error: {
            code: "404",
            message: `Tool with id ${idNumber} not found.`,
            details: "Could not find the requested resource.",
          },
        },
        { status: 404 }
      );
    }

    const existingToolTag = await prisma.toolTags.findMany({
      where: {
        toolId: existingTool.id
      }
    })

    if (existingToolTag) {
      await prisma.toolTags.deleteMany({
        where: {
          toolId: existingTool.id
        }
      })
    }

    await prisma.tool.delete({ where: { id: idNumber } });

    return NextResponse.json({
      message: `Tool with id ${idNumber} successfully deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "500",
          message: "Error deleting resource",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}