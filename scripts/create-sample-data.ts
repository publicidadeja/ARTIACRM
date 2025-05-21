import { prisma } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';

async function createSampleData() {
  try {
    // Obter o usuário administrador
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@artia.com' },
    });

    if (!adminUser) {
      console.log('Usuário administrador não encontrado. Execute npm run create:admin primeiro.');
      return;
    }

    // Criar um cliente de exemplo
    const client = await prisma.client.create({
      data: {
        id: uuidv4(),
        companyName: 'Empresa Exemplo',
        contactName: 'Contato Exemplo',
        email: 'contato@exemplo.com',
        phone: '(11) 99999-9999',
        address: 'Rua Exemplo, 123',
        userId: adminUser.id,
      },
    });

    console.log('Cliente de exemplo criado:', client);

    // Criar uma tarefa de exemplo
    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        title: 'Tarefa de Exemplo',
        description: 'Esta é uma tarefa de exemplo para testar o sistema.',
        status: 'pendente',
        priority: 'média',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
        clientId: client.id,
        userId: adminUser.id,
        comments: [
          {
            id: uuidv4(),
            text: 'Este é um comentário de exemplo',
            createdAt: new Date(),
            userId: adminUser.id,
            userName: adminUser.name,
          }
        ],
      },
    });

    console.log('Tarefa de exemplo criada:', task);

    console.log('Dados de exemplo criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 