
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PageTitle } from '@/components/app/PageTitle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Edit3, Trash2, Bot } from 'lucide-react';
import type { AIAgent } from '@/types';
import { INITIAL_AGENTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ManageAIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [agentToDelete, setAgentToDelete] = useState<AIAgent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedAgents = localStorage.getItem('artiaAiAgents');
    if (storedAgents) {
      try {
        setAgents(JSON.parse(storedAgents));
      } catch (e) {
        console.error("Failed to parse agents from localStorage", e);
        setAgents(INITIAL_AGENTS); 
      }
    } else {
      setAgents(INITIAL_AGENTS); 
      localStorage.setItem('artiaAiAgents', JSON.stringify(INITIAL_AGENTS));
    }
  }, []);

  useEffect(() => {
    if (agents.length > 0 || localStorage.getItem('artiaAiAgents')) {
        localStorage.setItem('artiaAiAgents', JSON.stringify(agents));
    } else if (agents.length === 0 && localStorage.getItem('artiaAiAgents')) {
         localStorage.removeItem('artiaAiAgents'); 
    }
  }, [agents]);

  const openDeleteDialog = (agent: AIAgent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAgent = () => {
    if (!agentToDelete) return;
    setAgents(prevAgents => prevAgents.filter(a => a.id !== agentToDelete.id));
    toast({
      title: "Agente Excluído",
      description: `O agente "${agentToDelete.name}" foi excluído.`,
    });
    setIsDeleteDialogOpen(false);
    setAgentToDelete(null);
  };

  return (
    <div className="container mx-auto py-2">
      <PageTitle
        title="Gerenciar Agentes de IA"
        actions={
          <Button asChild size="lg">
            <Link href="/ai-content-hub/agents/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Agente
            </Link>
          </Button>
        }
      />

      {agents.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum Agente Criado Ainda</h3>
            <p className="text-muted-foreground mb-4">Comece criando seu primeiro agente de IA especializado!</p>
            <Button asChild>
                <Link href="/ai-content-hub/agents/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Agente Agora
                </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <Card key={agent.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 pb-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={agent.avatarUrl || `https://placehold.co/100x100/7E8EF1/FFFFFF?text=${agent.name.substring(0,2).toUpperCase()}`} alt={agent.name} data-ai-hint="robot avatar" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">{agent.name.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{agent.name}</CardTitle>
                  <CardDescription className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full inline-block">
                    {agent.specialization}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{agent.description}</p>
              </CardContent>
              <CardFooter className="border-t pt-4 mt-auto flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/ai-content-hub/agents/${agent.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Editar
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(agent)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o agente "{agentToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgent} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir Agente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
