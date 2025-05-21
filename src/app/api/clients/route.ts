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

// GET /api/clients - Listar todos os clientes do usuário
export async function GET(request: NextRequest) {
  try {
    const { userId, authenticated } = await getUserId(request);
    
    if (!authenticated || !userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { companyName: 'asc' },
    });
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    return NextResponse.json(
      { message: 'Erro ao obter clientes' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Criar um novo cliente
export async function POST(request: NextRequest) {
  try {
    const { userId, authenticated } = await getUserId(request);
    
    if (!authenticated || !userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validação básica
    if (!data.companyName || !data.contactName || !data.contactEmail) {
      return NextResponse.json(
        { message: 'Dados obrigatórios ausentes' },
        { status: 400 }
      );
    }
    
    const client = await prisma.client.create({
      data: {
        ...data,
        userId,
        socialMediaCredentials: data.socialMediaCredentials ? JSON.stringify(data.socialMediaCredentials) : null,
      },
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { message: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
} 