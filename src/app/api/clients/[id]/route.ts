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

// Função para obter o userId a partir da sessão
async function getUserId(request: NextRequest) {
  // Obter sessão do next-auth
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    return { userId: session.user.id, authenticated: true };
  }
  
  return { userId: null, authenticated: false };
}

// GET /api/clients/[id] - Obter um cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, authenticated } = await getUserId(request);
    
    if (!authenticated || !userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const clientId = params.id;
    
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }
    
    // Verificar se o cliente pertence ao usuário atual
    if (client.userId !== userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    return NextResponse.json(
      { message: 'Erro ao obter cliente' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Atualizar um cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, authenticated } = await getUserId(request);
    
    if (!authenticated || !userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const clientId = params.id;
    const data = await request.json();
    
    // Verificar se o cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!existingClient) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }
    
    // Verificar se o cliente pertence ao usuário atual
    if (existingClient.userId !== userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    // Atualizar o cliente
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...data,
        socialMediaCredentials: data.socialMediaCredentials ? JSON.stringify(data.socialMediaCredentials) : null,
      },
    });
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Excluir um cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, authenticated } = await getUserId(request);
    
    if (!authenticated || !userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const clientId = params.id;
    
    // Verificar se o cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!existingClient) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }
    
    // Verificar se o cliente pertence ao usuário atual
    if (existingClient.userId !== userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
    }
    
    // Excluir o cliente
    await prisma.client.delete({
      where: { id: clientId },
    });
    
    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir cliente' },
      { status: 500 }
    );
  }
} 