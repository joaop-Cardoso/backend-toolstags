import { PrismaClient } from "@prisma/client";
class PrismaClientSingleton {// Define uma classe chamada PrismaClientSingleton, que implementa o padrão Singleton.

  // Variável estática para armazenar a instância única do PrismaClient.
  private static instance: PrismaClient;

  // Construtor privado para impedir que instâncias sejam criadas fora da classe.
  private constructor() {}

  // Método público e estático para obter a instância do PrismaClient.
  // Se a instância não existir, ela será criada.
  public static getInstance(): PrismaClient {
    // Verifica se a instância já foi criada. Se não, cria uma nova.
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({ errorFormat: 'pretty' });
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