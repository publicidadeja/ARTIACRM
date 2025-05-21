import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';
import { hash } from 'bcrypt';
// Simulação de envio de e-mail - em ambiente de produção, usar serviço de e-mail real
async function sendPasswordResetEmail(email: string, token: string) {
  console.log(`Enviando e-mail de recuperação para ${email} com token ${token}`);
  // Aqui entraria a lógica de envio de e-mail usando um serviço como SendGrid, Mailgun, etc.
  return true;
}

// Solicitar recuperação de senha
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Não informamos ao cliente se o e-mail existe ou não por segurança
      return NextResponse.json(
        { message: 'Se o e-mail estiver cadastrado, você receberá um link para recuperação de senha' },
        { status: 200 }
      );
    }

    // Gerar token aleatório
    const resetToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token válido por 1 hora

    // Armazenar token no banco de dados
    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: resetToken,
        expiresAt: tokenExpiry
      },
      create: {
        userId: user.id,
        token: resetToken,
        expiresAt: tokenExpiry
      }
    });

    // Enviar e-mail com o token
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json(
      { message: 'Se o e-mail estiver cadastrado, você receberá um link para recuperação de senha' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Redefinir senha com token
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar registro de reset pelo token
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date() // Token ainda é válido
        }
      },
      include: {
        user: true
      }
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await hash(password, 10);

    // Atualizar senha do usuário
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Remover o token usado
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id }
    });

    return NextResponse.json(
      { message: 'Senha atualizada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 