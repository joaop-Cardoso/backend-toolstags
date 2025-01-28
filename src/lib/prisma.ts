import { PrismaClient } from "@prisma/client";

class PrismaClientSingleton {
  // Variável estática para armazenar a instância única do PrismaClient.
  private static instance: PrismaClient;

  // Construtor privado para impedir que instâncias sejam criadas fora da classe.
  private constructor() { }

  // Método público e estático para obter a instância do PrismaClient.
  // Se a instância não existir, ela será criada.
  public static getInstance(): PrismaClient {
    // Verifica se a instância já foi criada. Se não, cria uma nova.
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({ errorFormat: "pretty" });

      // Middleware para preencher automaticamente toolName e tagName em ToolTags
      PrismaClientSingleton.instance.$use(async (params, next) => {
        // Verifica se o modelo é ToolTags e a ação é "create"
        if (params.model === "ToolTags" && params.action === "create") {
          const data = params.args.data;

          // Popula toolName com o nome da ferramenta correspondente
          if (data.toolId) {
            const tool = await PrismaClientSingleton.instance.tool.findUnique({
              where: { id: data.toolId },
            });
            data.toolName = tool?.name ?? "";
          }

          // Popula tagName com o nome da tag correspondente
          if (data.tagId) {
            const tag = await PrismaClientSingleton.instance.tag.findUnique({
              where: { id: data.tagId },
            });
            data.tagName = tag?.name ?? "";
          }

          // Atualiza os dados que serão enviados ao banco
          params.args.data = data;
        }

        // Continua a execução da requisição
        return next(params);
      });
    }

    // Retorna a instância existente ou recém-criada.
    return PrismaClientSingleton.instance;
  }
}

// Chama o método getInstance() para obter a instância do PrismaClient.
// Essa será a única instância usada em toda a aplicação.
const prisma = PrismaClientSingleton.getInstance();

// Exporta a instância para ser utilizada em outros módulos da aplicação.
export default prisma;