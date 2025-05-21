import { NextRequest, NextResponse } from 'next/server';
import { getFilePath, readFile } from '@/lib/storage';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstituir o caminho do arquivo a partir dos parâmetros da URL
    const filePath = params.path.join('/');
    
    // Obter o caminho absoluto do arquivo
    const absolutePath = getFilePath(filePath);
    
    try {
      // Ler o arquivo
      const fileContent = readFile(filePath);
      
      // Determinar o tipo MIME com base na extensão
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.doc':
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.xls':
        case '.xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
      }
      
      // Retornar o arquivo
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        }
      });
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      return NextResponse.json({ message: 'Arquivo não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error('Erro ao servir arquivo:', error);
    return NextResponse.json(
      { message: 'Erro ao servir arquivo' },
      { status: 500 }
    );
  }
} 