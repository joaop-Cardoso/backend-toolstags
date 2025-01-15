import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const getData = async (ExternalId: number) => {
  const tools = await prisma.tool.findUnique({
    where: { id: ExternalId },
  });

  if (!tools) {
    throw new Error(`Tool com id ${ExternalId} não encontrada.`);
  }

  return { tools };
};

export async function GET(request: NextRequest) {
  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "ID inválido",
          details: "O parâmetro de ID deve ser um número válido.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const data = await getData(idNumber);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "404",
          message: error.message,
          details: "Não foi possível encontrar o recurso solicitado.",
        },
      },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "ID inválido",
          details: "O parâmetro de ID deve ser um número válido.",
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
          message: "Dados inválidos",
          details: "O campo 'name' é obrigatório e deve ser uma string.",
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
            message: `Tool com id ${idNumber} não encontrada.`,
            details: "Não foi possível encontrar o recurso solicitado.",
          },
        },
        { status: 404 }
      );
    }

    const updatedTool = await prisma.tool.update({
      where: { id: idNumber },
      data: { name: body.name },
    });

    return NextResponse.json({ data: updatedTool });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "500",
          message: "Erro ao atualizar o recurso",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const partitionedUrl = request.nextUrl.pathname.split('/');
  const id = partitionedUrl[partitionedUrl.length - 1];
  const idNumber = +id;

  if (isNaN(idNumber)) {
    return NextResponse.json(
      {
        error: {
          code: "400",
          message: "ID inválido",
          details: "O parâmetro de ID deve ser um número válido.",
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
            message: `Tool com id ${idNumber} não encontrada.`,
            details: "Não foi possível encontrar o recurso solicitado.",
          },
        },
        { status: 404 }
      );
    }

    await prisma.tool.delete({ where: { id: idNumber } });

    return NextResponse.json({
      message: `Tool com id ${idNumber} excluída com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: "500",
          message: "Erro ao excluir o recurso",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
