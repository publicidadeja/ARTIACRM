import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCreativeContent } from '@/ai/flows/generate-creative-content-flow';

// Modelo Prisma para armazenar histórico de conteúdo gerado
// Deve ser adicionado ao schema.prisma:
/*
model AIContent {
  id            String    @id @default(uuid())
  userId        String
  clientId      String?
  instructions  String    @db.Text
  contentType   String
  toneOfVoice   String
  contentLength String
  language      String
  createdAt     DateTime  @default(now())
  content       String    @db.LongText
  user          User      @relation(fields: [userId], references: [id])
  client        Client?   @relation(fields: [clientId], references: [id])
  
  @@index([userId])
  @@index([clientId])
}
*/

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
    const input = await request.json();
    
    // Validação básica
    if (!input.instructions) {
      return NextResponse.json(
        { error: 'Instruções para geração são obrigatórias' },
        { status: 400 }
      );
    }

    // Obter dados do cliente, se fornecido
    let clientData = null;
    if (input.clientId) {
      clientData = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: {
          id: true,
          companyName: true,
          brandProfile: true,
          targetAudience: true,
          keywords: true,
          contentHistory: true,
          marketingObjectives: true,
          restrictions: true
        }
      });
    }

    // Preparar o contexto de cliente para IA
    const clientContextForAI = clientData ? {
      brandProfile: input.clientContextConfig?.useBrandProfile ? clientData.brandProfile : undefined,
      targetAudience: input.clientContextConfig?.useTargetAudience ? clientData.targetAudience : undefined,
      keywords: input.clientContextConfig?.useKeywords ? clientData.keywords : undefined,
      contentHistory: input.clientContextConfig?.useContentHistory ? clientData.contentHistory : undefined,
      marketingObjectives: input.clientContextConfig?.useMarketingObjectives ? clientData.marketingObjectives : undefined,
      restrictions: input.clientContextConfig?.useRestrictions ? clientData.restrictions : undefined,
    } : {};

    // Preparar entrada para o gerador
    const generatorInput = {
      clientName: clientData?.companyName,
      clientContext: clientContextForAI,
      instructions: input.instructions,
      contentType: input.contentType,
      socialPlatform: input.socialPlatform,
      toneOfVoice: input.toneOfVoice,
      contentLength: input.contentLength,
      specificDataToInclude: input.specificDataToInclude,
      contentFormat: input.contentFormat,
      language: input.language,
    };

    // Gerar conteúdo usando a mesma função que já existe na aplicação
    const result = await generateCreativeContent(generatorInput);

    // Armazenar no banco de dados
    await prisma.aIContent.create({
      data: {
        userId: userId,
        clientId: clientData?.id,
        instructions: input.instructions,
        contentType: input.contentType,
        toneOfVoice: input.toneOfVoice,
        contentLength: input.contentLength || 'medium',
        language: input.language,
        content: result.creativeContent,
        metadata: JSON.stringify({
          socialPlatform: input.socialPlatform,
          specificDataToInclude: input.specificDataToInclude,
          contentFormat: input.contentFormat,
          clientContextConfig: input.clientContextConfig,
          suggestions: result.suggestions
        }),
      }
    });

    return NextResponse.json({
      creativeContent: result.creativeContent,
      suggestions: result.suggestions || []
    });
  } catch (error) {
    console.error('Erro ao gerar conteúdo com IA:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a geração de conteúdo' },
      { status: 500 }
    );
  }
}

// Histórico de conteúdos gerados pelo usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const clientId = searchParams.get('clientId');
    
    // Construir condição de filtro
    const whereCondition: any = { userId };
    
    if (clientId) {
      whereCondition.clientId = clientId;
    }
    
    // Buscar histórico de conteúdos
    const aiContents = await prisma.aIContent.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });
    
    // Mapear resultados para formato mais legível na UI
    const mappedContents = aiContents.map(content => {
      let metadata = {};
      try {
        metadata = JSON.parse(content.metadata || '{}');
      } catch (e) {
        console.error('Erro ao parsear metadata:', e);
      }
      
      return {
        id: content.id,
        clientId: content.clientId,
        clientName: content.client?.companyName,
        contentType: content.contentType,
        toneOfVoice: content.toneOfVoice,
        language: content.language,
        createdAt: content.createdAt,
        contentSnippet: content.content.substring(0, 150) + (content.content.length > 150 ? '...' : ''),
        fullContent: content.content,
        ...metadata
      };
    });
    
    return NextResponse.json(mappedContents);
  } catch (error) {
    console.error('Erro ao buscar histórico de conteúdos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de conteúdos' },
      { status: 500 }
    );
  }
} 