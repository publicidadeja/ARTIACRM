import { prisma } from '../src/lib/db';
import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function migrateUsers() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    await prisma.user.create({
      data: {
        id: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
        photoURL: userData.photoURL,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      },
    });
  }
}

async function migrateClients() {
  const clientsSnapshot = await getDocs(collection(db, 'clients'));
  
  for (const doc of clientsSnapshot.docs) {
    const clientData = doc.data();
    await prisma.client.create({
      data: {
        id: doc.id,
        companyName: clientData.companyName,
        contactName: clientData.contactName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        userId: clientData.userId,
        createdAt: clientData.createdAt?.toDate() || new Date(),
        updatedAt: clientData.updatedAt?.toDate() || new Date(),
      },
    });
  }
}

async function migrateTasks() {
  const tasksSnapshot = await getDocs(collection(db, 'tasks'));
  
  for (const doc of tasksSnapshot.docs) {
    const taskData = doc.data();
    await prisma.task.create({
      data: {
        id: doc.id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate?.toDate(),
        clientId: taskData.clientId,
        userId: taskData.userId,
        comments: taskData.comments || null,
        attachments: taskData.attachments || null,
        createdAt: taskData.createdAt?.toDate() || new Date(),
        updatedAt: taskData.updatedAt?.toDate() || new Date(),
      },
    });
  }
}

async function migrateData() {
  try {
    console.log('Iniciando migração de dados...');
    
    console.log('Migrando usuários...');
    await migrateUsers();
    
    console.log('Migrando clientes...');
    await migrateClients();
    
    console.log('Migrando tarefas...');
    await migrateTasks();
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData(); 