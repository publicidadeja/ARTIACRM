import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Diretório para salvar uploads
const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    // Verificar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WEBP.' },
        { status: 400 }
      );
    }
    
    // Gerar nome de arquivo único
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    
    // Converter arquivo para arraybuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Criar diretório se não existir
    await writeFile(filePath, buffer);
    
    // URL pública do arquivo
    const avatarUrl = `/uploads/avatars/${fileName}`;
    
    // Atualizar URL no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: {
        image: avatarUrl,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Avatar atualizado com sucesso',
        url: avatarUrl
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao fazer upload de avatar:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o upload' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST para fazer upload de arquivos' }, { status: 405 });
} 