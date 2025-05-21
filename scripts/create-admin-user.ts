import { prisma } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';

async function createAdminUser() {
  try {
    console.log('Verificando usuário admin existente...');
    
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@artia.com' },
    });

    if (existingAdmin) {
      // Atualizar a senha se o usuário já existir
      console.log('Atualizando senha do usuário admin existente...');
      
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: 'artiaadmin',
        },
      });
      
      console.log('Usuário administrador atualizado com sucesso:');
      console.log('- ID:', updatedAdmin.id);
      console.log('- Email:', updatedAdmin.email);
      console.log('- Nome:', updatedAdmin.name);
      console.log('- Função:', updatedAdmin.role);
      console.log('- Senha definida como: "artiaadmin"');
      
      return updatedAdmin;
    }

    console.log('Criando novo usuário administrador...');
    
    // Criar um novo usuário admin
    const adminUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'admin@artia.com',
        name: 'Administrador Artia',
        role: 'administrador',
        password: 'artiaadmin',
        photoURL: null,
      },
    });

    console.log('Usuário administrador criado com sucesso:');
    console.log('- ID:', adminUser.id);
    console.log('- Email:', adminUser.email);
    console.log('- Nome:', adminUser.name);
    console.log('- Função:', adminUser.role);
    console.log('- Senha definida como: "artiaadmin"');
    
    return adminUser;
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 