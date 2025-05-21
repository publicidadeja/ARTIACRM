import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ai/agents/[id] - Obter um agente específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const agentId = params.id;
    
    // Buscar o agente
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        description: true,
        personalityStyle: true,
        basePrompt: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar permissão: deve ser público ou pertencer ao usuário
    if (!agent.isPublic && agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Erro ao obter agente:', error);
    return NextResponse.json(
      { error: 'Erro ao obter agente' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/agents/[id] - Atualizar um agente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const agentId = params.id;
    
    // Verificar existência e propriedade
    const existingAgent = await prisma.aIAgent.findUnique({
      where: { id: agentId }
    });
    
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    if (existingAgent.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este agente' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validação básica
    if (!data.name || !data.basePrompt) {
      return NextResponse.json(
        { error: 'Nome e prompt base são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Atualizar agente
    const updatedAgent = await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        name: data.name,
        description: data.description || existingAgent.description,
        personalityStyle: data.personalityStyle || existingAgent.personalityStyle,
        basePrompt: data.basePrompt,
        isPublic: data.isPublic !== undefined ? data.isPublic : existingAgent.isPublic,
      }
    });
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Erro ao atualizar agente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a atualização' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/agents/[id] - Excluir um agente
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const agentId = params.id;
    
    // Verificar existência e propriedade
    const existingAgent = await prisma.aIAgent.findUnique({
      where: { id: agentId }
    });
    
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agente não encontrado' },
        { status: 404 }
      );
    }
    
    if (existingAgent.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para excluir este agente' },
        { status: 403 }
      );
    }
    
    // Excluir agente
    await prisma.aIAgent.delete({
      where: { id: agentId }
    });
    
    return NextResponse.json({ message: 'Agente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir agente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a exclusão' },
      { status: 500 }
    );
  }
} 