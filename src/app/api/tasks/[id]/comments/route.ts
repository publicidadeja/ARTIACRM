import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tasks/[id]/comments - Listar comentários de uma tarefa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const taskId = params.id;
    
    // Verificar se a tarefa existe e pertence ao usuário ou é compartilhada
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        comments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem acesso à tarefa
    if (task.userId !== session.user.id) {
      // Aqui poderia haver lógica adicional para verificar acesso compartilhado
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta tarefa' },
        { status: 403 }
      );
    }
    
    // Converter a string JSON para objeto
    let comments = [];
    try {
      if (task.comments) {
        comments = JSON.parse(task.comments);
      }
    } catch (e) {
      console.error('Erro ao analisar comentários:', e);
    }
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Erro ao obter comentários:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Adicionar um comentário
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const taskId = params.id;
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'O texto do comentário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar tarefa para verificar permissões e dados existentes
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        comments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem acesso à tarefa
    if (task.userId !== userId) {
      // Aqui poderia haver lógica adicional para verificar acesso compartilhado
      return NextResponse.json(
        { error: 'Você não tem permissão para comentar nesta tarefa' },
        { status: 403 }
      );
    }
    
    // Buscar dados do usuário para incluir no comentário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true
      }
    });
    
    // Criar novo comentário
    const newComment = {
      id: `comment-${uuidv4()}`,
      userId: userId,
      userName: user?.name || 'Usuário',
      userAvatarUrl: user?.image || undefined,
      text: text,
      createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista existente
    let comments = [];
    try {
      if (task.comments) {
        comments = JSON.parse(task.comments);
      }
    } catch (e) {
      console.error('Erro ao analisar comentários:', e);
    }
    
    comments.push(newComment);
    
    // Atualizar a tarefa
    await prisma.task.update({
      where: { id: taskId },
      data: {
        comments: JSON.stringify(comments),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/comments?commentId=xyz - Remover um comentário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const taskId = params.id;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'ID do comentário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar tarefa para verificar permissões e dados existentes
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        comments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem acesso à tarefa
    if (task.userId !== userId) {
      // Aqui poderia haver lógica adicional para verificar acesso compartilhado
      return NextResponse.json(
        { error: 'Você não tem permissão para remover comentários desta tarefa' },
        { status: 403 }
      );
    }
    
    // Processar lista existente
    let comments = [];
    try {
      if (task.comments) {
        comments = JSON.parse(task.comments);
      }
    } catch (e) {
      console.error('Erro ao analisar comentários:', e);
      return NextResponse.json(
        { error: 'Erro ao processar comentários existentes' },
        { status: 500 }
      );
    }
    
    // Encontrar e remover o comentário
    const commentIndex = comments.findIndex((c: any) => c.id === commentId);
    
    if (commentIndex === -1) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o autor do comentário ou o dono da tarefa
    const comment = comments[commentIndex];
    if (comment.userId !== userId && task.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este comentário' },
        { status: 403 }
      );
    }
    
    // Remover o comentário
    comments.splice(commentIndex, 1);
    
    // Atualizar a tarefa
    await prisma.task.update({
      where: { id: taskId },
      data: {
        comments: JSON.stringify(comments),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ message: 'Comentário removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 