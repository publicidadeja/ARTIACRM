import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário não fornecido' }, { status: 400 });
    }

    // Verificar se o usuário a ser atualizado existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se é o administrador principal (para segurança adicional)
    if (existingUser.email === 'admin@artia.com') {
      // Apenas permitir a atualização do administrador principal por ele mesmo
      if (session.user.id !== existingUser.id) {
        return NextResponse.json(
          { error: 'Não é permitido modificar o administrador principal' },
          { status: 403 }
        );
      }
    }

    // Obter dados do body
    const data = await request.json();
    
    // Atualizar usuário (não permite mudar o email)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        role: data.role,
        updatedAt: new Date(),
      },
    });

    // Remover a senha da resposta
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário não fornecido' }, { status: 400 });
    }

    // Verificar se o usuário a ser excluído existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permitir excluir o administrador principal
    if (existingUser.email === 'admin@artia.com') {
      return NextResponse.json(
        { error: 'Não é permitido excluir o administrador principal' },
        { status: 403 }
      );
    }

    // Não permitir auto-exclusão
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Não é permitido excluir a própria conta' },
        { status: 403 }
      );
    }

    // Excluir usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 