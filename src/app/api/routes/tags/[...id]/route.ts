import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authMiddleware } from "@/app/api/util/authMiddleware";

const getData = async (ExternalId: number) => {
  const tag = await prisma.tag.findUnique({
    where: { id: ExternalId },
    include: {
      ToolTags: {
        select: {
          tool: true, // Inclui as ferramentas relacionadas
        },
      },
    },
  });

  if (!tag) {
    throw new Error(`Tag with id ${ExternalId} not found.`);
  }

  // Formata os dados para incluir as ferramentas diretamente no resultado
  const formattedTag = {
    id: tag.id,
    name: tag.name,
    tools: tag.ToolTags.length > 0 ? tag.ToolTags.map(toolTag => toolTag.tool) : undefined, // Inclui ferramentas somente se houver
  };

  // Remove a chave 'tools' se não houver ferramentas associadas
  if (!formattedTag.tools) {
    delete formattedTag.tools;
  }

  return formattedTag;
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
    const existingTag = await prisma.tag.findUnique({ where: { id: idNumber } });

    if (!existingTag) {
      return NextResponse.json(
        {
          error: {
            code: "404",
            message: `Tag with id ${idNumber} not found.`,
            details: "Could not find the requested resource.",
          },
        },
        { status: 404 }
      );
    }

    // Atualiza a tag com o novo nome
    const updatedTag = await prisma.tag.update({
      where: { id: idNumber },
      data: { name: body.name },
    });

    if (!body.tools) {
      return NextResponse.json({ data: updatedTag });
    }

    if (Array.isArray(body.tools)) {
      // Remove as associações antigas de ToolTags
      await prisma.toolTags.deleteMany({
        where: { tagId: idNumber },
      });

      // Recria as novas associações com as ferramentas fornecidas
      const newToolTags = [];
      for (const toolId of body.tools) {
        const tool = await prisma.tool.findUnique({ where: { id: toolId } });
        if (!tool) continue; // Ignora ferramentas inválidas

        // Cria nova associação
        const newTagAssociation = await prisma.toolTags.create({
          data: {
            toolId,
            tagId: idNumber,
            toolName: tool.name, // Usa o nome da ferramenta
            tagName: existingTag.name, // Usa o nome da tag já existente
          },
        });

        newToolTags.push(newTagAssociation); // Armazena a nova associação
      }

      // Busca todas as ferramentas associadas à tag
      const updatedTools = await prisma.toolTags.findMany({
        where: { tagId: idNumber },
        include: { tool: true }, // Inclui os dados da ferramenta
      });

      return NextResponse.json({
        data: {
          tag: updatedTag,
          tools: updatedTools.map((toolTag) => toolTag.tool), // Retorna as ferramentas associadas
        },
      });
    }

    return NextResponse.json({ data: updatedTag });
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
    const existingTag = await prisma.tag.findUnique({ where: { id: idNumber } });

    if (!existingTag) {
      return NextResponse.json(
        {
          error: {
            code: "404",
            message: `Tag with id ${idNumber} not found.`,
            details: "Could not find the requested resource.",
          },
        },
        { status: 404 }
      );
    }

    const existingToolTag = await prisma.toolTags.findMany({
      where: {
        tagId: existingTag.id
      }
    })

    if (existingToolTag) {
      await prisma.toolTags.deleteMany({
        where: {
          tagId: existingTag.id
        }
      })
    }


    await prisma.tag.delete({ where: { id: idNumber } });

    return NextResponse.json({
      message: `Tag with id ${idNumber} successfully deleted.`,
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
