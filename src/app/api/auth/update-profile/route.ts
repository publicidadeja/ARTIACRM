import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hash, compare } from 'bcrypt';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { name, currentPassword, newPassword, image } = await request.json();
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Atualizar nome se fornecido
    if (name) {
      updateData.name = name;
    }
    
    // Atualizar imagem se fornecida
    if (image) {
      updateData.image = image;
    }
    
    // Atualizar senha se fornecida
    if (currentPassword && newPassword) {
      // Verificar senha atual
      const passwordValid = await compare(currentPassword, user.password);
      
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 400 }
        );
      }
      
      // Hash da nova senha
      updateData.password = await hash(newPassword, 10);
    }
    
    // Atualizar perfil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Perfil atualizado com sucesso',
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 