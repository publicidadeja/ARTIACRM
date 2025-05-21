
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PageTitle } from '@/components/app/PageTitle';
import { BarChart2, List, Users, PlusCircle, Eye, Edit3, Bot, History, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { AIAgent, GeneratedContentItem } from '@/types';
import { INITIAL_AGENTS } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle as DialogTitleContent, DialogDescription as DialogDescriptionContent, DialogFooter as DialogFooterContent } from '@/components/ui/dialog';


const initialStats = [
  { title: "Conteúdos Gerados (Mês)", value: "N/A", icon: List, change: "Dados reais viriam de um banco de dados", changeType: "neutral" as const },
  { title: "Agente Mais Usado", value: "N/A", icon: Bot, change: "Dados reais viriam de um banco de dados", changeType: "neutral" as const },
  { title: "Tempo Médio/Geração", value: "N/A", icon: Users, change: "Dados reais viriam de um banco de dados", changeType: "neutral" as const },
  { title: "Taxa de Aprovação", value: "N/A", icon: BarChart2, change: "Dados reais viriam de um banco de dados", changeType: "neutral" as const },
];

export default function AIContentHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [recentGeneratedContents, setRecentGeneratedContents] = useState<GeneratedContentItem[]>([]);
  const [selectedContentForView, setSelectedContentForView] = useState<GeneratedContentItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    const storedAgents = localStorage.getItem('artiaAiAgents');
    if (storedAgents) {
      try {
        const parsedAgents = JSON.parse(storedAgents);
        setAgents(Array.isArray(parsedAgents) ? parsedAgents : INITIAL_AGENTS);
      } catch (e) {
        console.error("Failed to parse agents from localStorage", e);
        setAgents(INITIAL_AGENTS); 
      }
    } else {
      setAgents(INITIAL_AGENTS); 
    }

    const storedGeneratedContents = localStorage.getItem('artiaGeneratedContents');
    if (storedGeneratedContents) {
      try {
        const parsedContents: GeneratedContentItem[] = JSON.parse(storedGeneratedContents);
        parsedContents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentGeneratedContents(parsedContents.slice(0, 5));
      } catch (e) {
        console.error("Failed to parse generated contents from localStorage", e);
        setRecentGeneratedContents([]);
      }
    }
  }, []);

  const handleViewContent = (content: GeneratedContentItem) => {
    setSelectedContentForView(content);
    setIsViewDialogOpen(true);
  };

  const handleReutilizeContent = (content: GeneratedContentItem) => {
    try {
      localStorage.setItem('artiaContentToReuse', JSON.stringify(content));
      router.push('/ai-content-hub/create');
    } catch (error) {
      console.error("Erro ao preparar conteúdo para reutilização:", error);
      toast({
        title: "Erro ao Reutilizar",
        description: "Não foi possível preparar o conteúdo para reutilização.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto py-2">
      <PageTitle
        title="Hub de Criação de Conteúdo IA"
        actions={
          <Button asChild size="lg">
            <Link href="/ai-content-hub/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Conteúdo com IA
            </Link>
          </Button>
        }
      />

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <BarChart2 className="mr-2 h-5 w-5 text-primary" />
          Visão Geral e Estatísticas
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {initialStats.map(stat => (
            <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <History className="mr-2 h-5 w-5 text-primary" />
                Conteúdos Gerados Recentemente
              </CardTitle>
              <CardDescription>Acompanhe suas últimas criações aqui.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                {recentGeneratedContents.length === 0 ? (
                    <div className="text-center text-muted-foreground p-6">
                        <List className="mx-auto h-12 w-12 mb-4" />
                        <p className="mb-1">Nenhum conteúdo gerado recentemente.</p>
                        <p className="text-xs">Crie um novo conteúdo para vê-lo aqui.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full w-full">
                        <div className="space-y-1 p-1">
                            {recentGeneratedContents.map((content, index) => (
                                <React.Fragment key={content.id || index}>
                                    <div className="p-3 hover:bg-muted/50 rounded-md transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-medium text-foreground text-sm line-clamp-1" title={content.originalInstructions}>
                                              {content.originalInstructions.substring(0,60) + "..."}
                                            </h4>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                              {format(parseISO(content.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Tipo: {content.contentType} {content.clientName && `| Cliente: ${content.clientName}`}
                                            {content.agentUsed && ` | Agente: ${content.agentUsed.name}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          <strong>Trecho:</strong> {content.contentSnippet}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Button variant="outline" size="xs" onClick={() => handleViewContent(content)}><Eye className="mr-1 h-3 w-3" /> Visualizar</Button>
                                            <Button variant="outline" size="xs" onClick={() => handleReutilizeContent(content)}><RotateCcw className="mr-1 h-3 w-3" /> Reutilizar</Button>
                                        </div>
                                    </div>
                                    {index < recentGeneratedContents.length - 1 && <Separator />}
                                </React.Fragment>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
            <CardFooter className="border-t pt-4 mt-auto">
                  <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
                    <Link href="/ai-content-hub/history">Ver todo o histórico</Link>
                  </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="lg:col-span-1">
          <Card className="shadow-lg h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Agentes Especializados
              </CardTitle>
              <CardDescription>Seus assistentes de IA prontos para ajudar.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {agents.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-4">
                    {agents.map((agent, index) => (
                       <React.Fragment key={agent.id}>
                          <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={agent.avatarUrl || `https://placehold.co/100x100/7E8EF1/FFFFFF?text=${agent.name.substring(0,2).toUpperCase()}`} alt={agent.name} data-ai-hint="robot avatar"/>
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">{agent.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground">{agent.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs" asChild>
                              <Link href={`/ai-content-hub/create?agentId=${agent.id}`}>
                                Usar
                              </Link>
                            </Button>
                          </div>
                          {index < agents.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                 <Bot className="mx-auto h-12 w-12 mb-4" />
                 <p className="text-sm">Nenhum agente especializado configurado.</p>
                 <Button variant="link" size="sm" className="mt-1 text-primary" asChild>
                    <Link href="/ai-content-hub/agents">Crie seu primeiro agente</Link>
                 </Button>
                </div>
              )}
            </CardContent>
             <CardFooter className="border-t pt-4 mt-auto">
                <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
                    <Link href="/ai-content-hub/agents">Gerenciar Agentes</Link>
                </Button>
             </CardFooter>
          </Card>
        </section>
      </div>

      {selectedContentForView && (
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitleContent>{selectedContentForView.originalInstructions.substring(0,70) + "..." || `Conteúdo: ${selectedContentForView.contentType}`}</DialogTitleContent>
                    <DialogDescriptionContent>
                        Gerado em: {format(parseISO(selectedContentForView.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {selectedContentForView.clientName && ` | Cliente: ${selectedContentForView.clientName}`}
                        {selectedContentForView.agentUsed && ` | Agente: ${selectedContentForView.agentUsed.name}`}
                    </DialogDescriptionContent>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4">
                    <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
                        {selectedContentForView.fullContent}
                    </pre>
                </ScrollArea>
                 <DialogFooterContent className="mt-4">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
                </DialogFooterContent>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
