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

// GET /api/tasks/[id] - Obter uma tarefa específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        client: {
          select: {
            companyName: true,
            brandProfile: true,
            targetAudience: true,
            keywords: true,
          },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }
    
    // Verificar se a tarefa pertence ao usuário atual ou se é um administrador
    if (task.userId !== session.user.id && session.user.role !== 'administrador') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Erro ao obter tarefa:', error);
    return NextResponse.json(
      { message: 'Erro ao obter tarefa' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Atualizar uma tarefa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const taskId = params.id;
    const data = await request.json();
    
    // Verificar se a tarefa existe
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!existingTask) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }
    
    // Verificar se a tarefa pertence ao usuário atual ou se é um administrador
    if (existingTask.userId !== session.user.id && session.user.role !== 'administrador') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    // Preparar dados para atualização
    const taskData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      comments: data.comments ? JSON.stringify(data.comments) : existingTask.comments,
      attachments: data.attachments ? JSON.stringify(data.attachments) : existingTask.attachments,
    };
    
    // Atualizar a tarefa
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: taskData,
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Excluir uma tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    // Verificar se a tarefa existe
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!existingTask) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }
    
    // Verificar se a tarefa pertence ao usuário atual ou se é um administrador
    if (existingTask.userId !== session.user.id && session.user.role !== 'administrador') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    // Excluir a tarefa
    await prisma.task.delete({
      where: { id: taskId },
    });
    
    return NextResponse.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir tarefa' },
      { status: 500 }
    );
  }
} 