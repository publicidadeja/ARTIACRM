import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Task } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar tarefas do usuário
    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: true,
      },
    });

    // Buscar todos os usuários (limite de 10 para atividades recentes)
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoURL: true,
      },
    });

    // Estatísticas
    const completedTasksCount = tasks.filter((task: Task) => task.status === 'concluido').length;
    const pendingTasksCount = tasks.filter((task: Task) => task.status !== 'concluido').length;
    
    // Calcular tarefas com prazo vencido
    const now = new Date();
    const overdueTasks = tasks.filter((task: Task) => {
      if (!task.dueDate || task.status === 'concluido') return false;
      return new Date(task.dueDate) < now;
    });

    // Processar dados de gráfico (últimos 6 meses)
    const monthlyTasksData = Array(6).fill(0).map((_, index) => {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - (5 - index));
      
      const month = monthDate.toLocaleString('pt-BR', { month: 'short' });
      
      const tasksInMonth = tasks.filter((task: Task) => {
        if (!task.updatedAt || task.status !== 'concluido') return false;
        
        const taskDate = new Date(task.updatedAt);
        return taskDate.getMonth() === monthDate.getMonth() && 
               taskDate.getFullYear() === monthDate.getFullYear();
      });
      
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        tasks: tasksInMonth.length
      };
    });

    // Status para gráfico de pizza
    const statusData = [
      { name: 'Concluído', value: tasks.filter((t: Task) => t.status === 'concluido').length, fill: 'hsl(var(--chart-1))' },
      { name: 'Em Andamento', value: tasks.filter((t: Task) => ['em_andamento', 'revisao', 'aprovacao_cliente'].includes(t.status)).length, fill: 'hsl(var(--chart-2))' },
      { name: 'Pendente', value: tasks.filter((t: Task) => ['a_fazer', 'backlog'].includes(t.status)).length, fill: 'hsl(var(--chart-3))' },
      { name: 'Atrasado', value: overdueTasks.length, fill: 'hsl(var(--destructive))' },
    ].filter(item => item.value > 0);

    return NextResponse.json({
      tasks,
      users,
      stats: {
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        overdueTasks: overdueTasks.length,
        totalTasks: tasks.length
      },
      charts: {
        productivity: monthlyTasksData,
        status: statusData.length > 0 ? statusData : [
          { name: 'Concluído', value: 0, fill: 'hsl(var(--chart-1))' },
          { name: 'Em Andamento', value: 0, fill: 'hsl(var(--chart-2))' },
          { name: 'Pendente', value: 0, fill: 'hsl(var(--chart-3))' },
          { name: 'Atrasado', value: 0, fill: 'hsl(var(--destructive))' },
        ]
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 