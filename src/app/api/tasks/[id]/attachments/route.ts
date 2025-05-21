import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { join } from 'path';

// Diretório para armazenar anexos
const ATTACHMENTS_DIR = join(process.cwd(), 'public', 'uploads', 'attachments');

// Estrutura de resposta para anexos
interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  createdAt: string;
}

// GET /api/tasks/[id]/attachments - Listar anexos de uma tarefa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const taskId = params.id;
    
    // Verificar se a tarefa existe e pertence ao usuário ou é compartilhada
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        attachments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário tem acesso à tarefa
    if (task.userId !== session.user.id) {
      // Aqui poderia haver lógica adicional para verificar acesso compartilhado
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta tarefa' },
        { status: 403 }
      );
    }
    
    // Converter a string JSON para objeto
    let attachments = [];
    try {
      if (task.attachments) {
        attachments = JSON.parse(task.attachments);
      }
    } catch (e) {
      console.error('Erro ao analisar anexos:', e);
    }
    
    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Erro ao obter anexos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/attachments - Adicionar anexo (formato JSON para texto, formdata para arquivos)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const taskId = params.id;
    
    // Verificar se a tarefa existe e pertence ao usuário
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        attachments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta tarefa' },
        { status: 403 }
      );
    }
    
    // Analisar lista existente de anexos
    let attachments: Attachment[] = [];
    try {
      if (task.attachments) {
        attachments = JSON.parse(task.attachments);
      }
    } catch (e) {
      console.error('Erro ao analisar anexos:', e);
    }
    
    // Verificar o tipo de conteúdo da requisição
    const contentType = request.headers.get('content-type') || '';
    
    let newAttachment: Attachment;
    
    if (contentType.includes('application/json')) {
      // Processar anexo de texto
      const { name, content, type = 'document' } = await request.json();
      
      if (!name || !content) {
        return NextResponse.json(
          { error: 'Nome e conteúdo são obrigatórios' },
          { status: 400 }
        );
      }
      
      const attachmentId = `att-${uuidv4()}`;
      const fileName = `${attachmentId}-${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(ATTACHMENTS_DIR, fileName);
      
      // Garantir que o diretório existe
      try {
        await mkdir(ATTACHMENTS_DIR, { recursive: true });
      } catch (e) {
        // Ignorar erro se o diretório já existir
      }
      
      // Salvar conteúdo como arquivo de texto
      await writeFile(filePath, content);
      
      newAttachment = {
        id: attachmentId,
        name: name,
        url: `/uploads/attachments/${fileName}`,
        type: type,
        size: `${Buffer.from(content).length} bytes`,
        createdAt: new Date().toISOString()
      };
      
    } else if (contentType.includes('multipart/form-data')) {
      // Processar upload de arquivo
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'Nenhum arquivo enviado' },
          { status: 400 }
        );
      }
      
      const attachmentId = `att-${uuidv4()}`;
      const fileName = `${attachmentId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(ATTACHMENTS_DIR, fileName);
      
      // Garantir que o diretório existe
      try {
        await mkdir(ATTACHMENTS_DIR, { recursive: true });
      } catch (e) {
        // Ignorar erro se o diretório já existir
      }
      
      // Salvar arquivo
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      // Determinar o tipo de anexo
      let type = 'document';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }
      
      newAttachment = {
        id: attachmentId,
        name: file.name,
        url: `/uploads/attachments/${fileName}`,
        type: type,
        size: `${file.size} bytes`,
        createdAt: new Date().toISOString()
      };
    } else {
      return NextResponse.json(
        { error: 'Tipo de conteúdo não suportado' },
        { status: 415 }
      );
    }
    
    // Adicionar o novo anexo à lista e atualizar a tarefa
    attachments.push(newAttachment);
    
    await prisma.task.update({
      where: { id: taskId },
      data: {
        attachments: JSON.stringify(attachments),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(newAttachment, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar anexo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/attachments?attachmentId=xyz - Remover um anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const taskId = params.id;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');
    
    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID do anexo é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se a tarefa existe e pertence ao usuário
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        attachments: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }
    
    if (task.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta tarefa' },
        { status: 403 }
      );
    }
    
    // Processar lista existente
    let attachments: Attachment[] = [];
    try {
      if (task.attachments) {
        attachments = JSON.parse(task.attachments);
      }
    } catch (e) {
      console.error('Erro ao analisar anexos:', e);
      return NextResponse.json(
        { error: 'Erro ao processar anexos existentes' },
        { status: 500 }
      );
    }
    
    // Encontrar o anexo a ser removido
    const attachmentIndex = attachments.findIndex(a => a.id === attachmentId);
    
    if (attachmentIndex === -1) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }
    
    // Removê-lo da lista
    const removedAttachment = attachments[attachmentIndex];
    attachments.splice(attachmentIndex, 1);
    
    // Atualizar a tarefa
    await prisma.task.update({
      where: { id: taskId },
      data: {
        attachments: JSON.stringify(attachments),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      message: 'Anexo removido com sucesso',
      removedAttachment
    });
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 