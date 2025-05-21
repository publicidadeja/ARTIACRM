import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Extender a tipagem do usuário do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    }
  }
}

// GET /api/tasks - Listar todas as tarefas do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Obter parâmetros de consulta para filtrar
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    
    // Construir condição de filtro
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    const tasks = await prisma.task.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            companyName: true,
          },
        },
      },
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Erro ao obter tarefas:', error);
    return NextResponse.json(
      { message: 'Erro ao obter tarefas' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Criar uma nova tarefa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const data = await request.json();
    
    // Validação básica
    if (!data.title || !data.status || !data.priority) {
      return NextResponse.json(
        { message: 'Dados obrigatórios ausentes' },
        { status: 400 }
      );
    }
    
    // Preparar dados para salvar
    const taskData = {
      ...data,
      userId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      comments: data.comments ? JSON.stringify(data.comments) : null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
    };
    
    const task = await prisma.task.create({
      data: taskData,
    });
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return NextResponse.json(
      { message: 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
} 