import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== 'administrador') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoURL: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é administrador
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!adminUser || adminUser.role !== 'administrador') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Obter dados do body
    const data = await request.json();
    
    // Validar dados
    if (!data.name || !data.email || !data.role || !data.password) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        id: data.id || undefined,
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
        photoURL: data.photoURL || `https://placehold.co/100x100/E0F7FA/1C4A5C?text=${data.name.substring(0,2).toUpperCase()}`,
      },
    });

    // Remover a senha da resposta
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 