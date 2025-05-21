import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveFile } from '@/lib/storage';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter o formData da requisição
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || '';
    
    if (!file) {
      return NextResponse.json({ message: 'Arquivo não fornecido' }, { status: 400 });
    }
    
    // Converter o arquivo para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Salvar o arquivo
    const filePath = await saveFile(buffer, file.name, folder);
    
    return NextResponse.json({ filePath }, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    return NextResponse.json(
      { message: 'Erro ao fazer upload de arquivo' },
      { status: 500 }
    );
  }
} 