import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Modelo Prisma para armazenar agentes de IA
// Deve ser adicionado ao schema.prisma:
/*
model AIAgent {
  id                String    @id @default(uuid())
  userId            String
  name              String
  description       String?   @db.Text
  personalityStyle  String?   @db.Text
  basePrompt        String    @db.Text
  isPublic          Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  user              User      @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
*/

// GET /api/ai/agents - Listar agentes
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
    const includePublic = searchParams.get('includePublic') === 'true';
    
    // Construir condição de filtro
    let whereCondition: any = {};
    
    if (includePublic) {
      whereCondition = {
        OR: [
          { userId },
          { isPublic: true }
        ]
      };
    } else {
      whereCondition = { userId };
    }
    
    // Buscar agentes
    const agents = await prisma.aIAgent.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        personalityStyle: true,
        basePrompt: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Erro ao obter agentes de IA:', error);
    return NextResponse.json(
      { error: 'Erro ao obter agentes de IA' },
      { status: 500 }
    );
  }
}

// POST /api/ai/agents - Criar um novo agente
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
    const data = await request.json();
    
    // Validação básica
    if (!data.name || !data.basePrompt) {
      return NextResponse.json(
        { error: 'Nome e prompt base são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar o agente
    const agent = await prisma.aIAgent.create({
      data: {
        userId,
        name: data.name,
        description: data.description || '',
        personalityStyle: data.personalityStyle || '',
        basePrompt: data.basePrompt,
        isPublic: data.isPublic || false,
      }
    });
    
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agente de IA:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agente de IA' },
      { status: 500 }
    );
  }
} 