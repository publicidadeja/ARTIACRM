import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o e-mail já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está em uso' },
        { status: 409 }
      );
    }

    // Gerar hash da senha
    const hashedPassword = await hash(password, 10);

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'membro', // Função padrão para novos registros
        image: `https://placehold.co/100x100/E0F7FA/1C4A5C?text=${name.substring(0,2).toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Remover a senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Usuário registrado com sucesso', 
        user: userWithoutPassword 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o registro' },
      { status: 500 }
    );
  }
} 