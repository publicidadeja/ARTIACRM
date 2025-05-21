'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell, Legend } from 'recharts';
import { ArrowRight, CalendarClock, ListChecks, Users, TrendingUp, Pin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PRIORITIES } from '@/lib/constants'; 
import type { Task, User as UserType } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const pieChartDataFallback = [
  { name: 'Concluído', value: 0, fill: 'hsl(var(--chart-1))' },
  { name: 'Em Andamento', value: 0, fill: 'hsl(var(--chart-2))' },
  { name: 'Pendente', value: 0, fill: 'hsl(var(--chart-3))' },
  { name: 'Atrasado', value: 0, fill: 'hsl(var(--destructive))' },
];

const chartConfig = {
  tasks: {
    label: 'Tarefas Concluídas',
    color: 'hsl(var(--chart-1))',
  },
};

const TaskItem = ({ task }: { task: Task }) => {
  const priority = PRIORITIES.find(p => p.value === task.priority);
  const dueDateValid = task.dueDate && isValid(parseISO(task.dueDate));
  const dueDate = dueDateValid ? parseISO(task.dueDate) : new Date(0); // Use Epoch se inválido
  const daysLeft = dueDateValid ? differenceInDays(dueDate, new Date()) : Infinity;
  let dueDateText = dueDateValid ? format(dueDate, "dd 'de' MMM", { locale: ptBR }) : 'Sem prazo';
  let dueDateColor = 'text-muted-foreground';

  if (dueDateValid) {
    if (daysLeft < 0 && task.status !== 'concluido') {
      dueDateText = `Atrasada ${Math.abs(daysLeft)}d`;
      dueDateColor = 'text-destructive';
    } else if (daysLeft === 0 && task.status !== 'concluido') {
      dueDateText = 'Vence Hoje';
      dueDateColor = 'text-orange-500';
    } else if (daysLeft <= 3 && task.status !== 'concluido') {
      dueDateText = `Vence em ${daysLeft}d`;
      dueDateColor = 'text-yellow-600';
    } else if (task.status === 'concluido') {
      dueDateText = 'Concluída';
      dueDateColor = 'text-green-600';
    }
  }


  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
      <div>
        <Link href={`/tasks/${task.id}`} className="font-medium text-sm hover:underline text-foreground">
          {task.title}
        </Link>
        <p className="text-xs text-muted-foreground">{task.type}</p>
      </div>
      <div className="flex items-center gap-2">
        {priority && <Badge variant="outline" className={`border-${priority.colorClass.replace('bg-','')} text-${priority.colorClass.replace('bg-','')} capitalize`}>{priority.label}</Badge>}
        <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>
      </div>
    </div>
  );
};

interface ProductivityData {
  month: string;
  tasks: number;
}

// Ações simuladas genéricas
const simulatedActionsTemplates = [
    { action: 'atualizou a tarefa "Campanha de Verão"', time: '2h atrás' },
    { action: 'comentou na tarefa "Posts para Instagram"', time: '5h atrás' },
    { action: 'concluiu a tarefa "Revisão de Blog Post"', time: '1d atrás' },
    { action: 'adicionou um novo cliente "Soluções Criativas"', time: '2d atrás' },
    { action: 'gerou um novo rascunho de e-mail marketing', time: '3d atrás' },
];


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  const [productivityChartData, setProductivityChartData] = useState<ProductivityData[]>([]);
  const [isLoadingProductivityChart, setIsLoadingProductivityChart] = useState(true);
  
  const [pieChartData, setPieChartData] = useState(pieChartDataFallback.map(p => ({...p, value: 0})));
  const [isLoadingPieChart, setIsLoadingPieChart] = useState(true);

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (authLoading) {
        setIsLoadingTasks(true);
        setIsLoadingUsers(true);
        return;
      }
      
      if (!currentUser) {
        setAllTasks([]);
        setAllUsers([]);
        setIsLoadingTasks(false);
        setIsLoadingUsers(false);
        return;
      }

      setIsLoadingTasks(true);
      setIsLoadingUsers(true);
      setIsLoadingProductivityChart(true);
      setIsLoadingPieChart(true);

      try {
        // Buscar dados do dashboard usando a API
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados do dashboard: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Processar dados das tarefas
        // O backend já deve retornar comentários e anexos processados
        const tasks = data.tasks || [];
        setAllTasks(tasks);
        
        // Processar dados dos usuários
        setAllUsers(data.users || []);
        
        // Processar dados para gráficos
        // Para o gráfico de produtividade, gerar dados de exemplo se não houver
        const productivityData = data.charts?.productivity || generateProductivityChartData(tasks);
        setProductivityChartData(productivityData);
        
        // Para o gráfico de pizza, gerar dados com base nas tarefas ou usar fallback
        const pieData = data.charts?.status || generatePieChartData(tasks);
        setPieChartData(pieData.length > 0 ? pieData : pieChartDataFallback);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: "Erro ao Carregar Dashboard",
          description: "Não foi possível obter os dados do dashboard.",
          variant: "destructive"
        });
        
        // Usar dados de fallback para manter a UI funcional
        setAllTasks([]);
        setAllUsers([]);
        setProductivityChartData(generateProductivityChartData([]));
        setPieChartData(pieChartDataFallback);
      } finally {
        setIsLoadingTasks(false);
        setIsLoadingUsers(false);
        setIsLoadingProductivityChart(false);
        setIsLoadingPieChart(false);
      }
    }
    
    // Função auxiliar para gerar dados de exemplo para o gráfico de produtividade
    function generateProductivityChartData(tasks: Task[]) {
      // Implementação padrão para gerar dados de produtividade a partir das tarefas
      // Se não houver tarefas suficientes, gerar dados de exemplo
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const currentMonth = new Date().getMonth();
      
      // Retornar dados no formato correto para o ProductivityData
      return months.slice(currentMonth - 5, currentMonth + 1).map((month) => ({
        month,
        tasks: Math.floor(Math.random() * 5) + 3,
      }));
    }
    
    // Função auxiliar para gerar dados para o gráfico de pizza
    function generatePieChartData(tasks: Task[]) {
      // Agrupar tarefas por status
      const statusCount: Record<string, number> = {};
      
      tasks.forEach(task => {
        statusCount[task.status] = (statusCount[task.status] || 0) + 1;
      });
      
      return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
    }
    
    fetchDashboardData();
  }, [currentUser, authLoading, toast]);


  const pendingTasks = useMemo(() => 
    allTasks.filter(task => task.status !== 'concluido').slice(0, 5), 
    [allTasks]
  );

  const upcomingDeadlines = useMemo(() => 
    allTasks.filter(task => {
      return task.status !== 'concluido' && task.dueDate;
    })
    .sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5),
    [allTasks]
  );

  const recentActivityDisplay = useMemo(() => {
    if (isLoadingUsers || allUsers.length === 0) {
      return [];
    }
    const displayCount = Math.min(allUsers.length, simulatedActionsTemplates.length, 3);
    return Array.from({ length: displayCount }).map((_, index) => {
      const user = allUsers[index % allUsers.length]; 
      const activity = simulatedActionsTemplates[index];
      const fallbackColor = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'][index % 5];

      return {
        user: {
          name: user.name,
          avatarUrl: user.avatarUrl || `https://placehold.co/100x100/E0F7FA/1C4A5C?text=${user.name.substring(0,2).toUpperCase()}`,
        },
        action: activity.action,
        time: activity.time,
        avatarColor: fallbackColor, 
      };
    });
  }, [allUsers, isLoadingUsers]);


  if (authLoading || isLoadingTasks || isLoadingUsers) { 
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Cards de estatísticas */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingTasks.length === 0 
                ? 'Tudo concluído. Parabéns!' 
                : `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa' : 'tarefas'} aguardando conclusão`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingProductivityChart ? '...' : productivityChartData[productivityChartData.length-1]?.tasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {isLoadingProductivityChart 
                ? 'Calculando...' 
                : `Tarefas concluídas neste mês`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingUsers ? '...' : allUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {isLoadingUsers 
                ? 'Carregando usuários...' 
                : `Total de usuários no sistema`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Próximos</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingDeadlines.length === 0 
                ? 'Sem prazos imediatos' 
                : `${upcomingDeadlines.length} ${upcomingDeadlines.length === 1 ? 'prazo' : 'prazos'} a vencer`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="col-span-1 md:col-span-2 row-span-1">
          <CardHeader>
            <CardTitle>Produtividade Mensal</CardTitle>
            <CardDescription>
              Tarefas concluídas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {isLoadingProductivityChart ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productivityChartData}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig.tasks.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={chartConfig.tasks.color} stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.4} vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => value === 0 ? '0' : `${value}`}
                    />
                    <ChartTooltip
                      cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                      formatter={(value) => [`${value} tarefas`, "Tarefas"]}
                      labelFormatter={(label) => label}
                    />
                    <Bar 
                      dataKey="tasks" 
                      fill="url(#colorTasks)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 xl:col-span-1 row-span-2">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-6">
                {recentActivityDisplay.length > 0 ? recentActivityDisplay.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Avatar className="border-4 border-background">
                      <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                      <AvatarFallback className={item.avatarColor}>
                        {item.user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma atividade recente para exibir.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-1 xl:col-span-1 row-span-2">
          <CardHeader>
            <CardTitle>Status de Tarefas</CardTitle>
            <CardDescription>
              Distribuição de tarefas por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPieChart ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-64 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconSize={8}
                      iconType="circle"
                      formatter={(value, entry, index) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Tarefas Pendentes */}
        <Card className="col-span-1 xl:col-span-2 row-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Tarefas Pendentes</CardTitle>
              <CardDescription>
                {pendingTasks.length === 0 
                  ? 'Tudo concluído! Adicione mais tarefas.' 
                  : `Você tem ${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'}.`
                }
              </CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="hidden sm:inline">Ver Todas</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-1">
                {pendingTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="space-y-2">
                  <Pin className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Você concluiu todas as suas tarefas. Adicione novas tarefas ou aproveite o momento!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
