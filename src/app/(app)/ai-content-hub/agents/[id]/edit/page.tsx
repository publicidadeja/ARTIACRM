
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { AgentForm } from '@/components/app/AgentForm';
import type { AIAgent } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { INITIAL_AGENTS } from '@/lib/constants'; // Used as fallback

export default function EditAIAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [agentToEdit, setAgentToEdit] = useState<AIAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setError("ID do agente não fornecido.");
      setLoading(false);
      return;
    }

    const storedAgents = localStorage.getItem('artiaAiAgents');
    let agents: AIAgent[] = [];
    if (storedAgents) {
      try {
        agents = JSON.parse(storedAgents);
      } catch (e) {
        console.error("Failed to parse agents from localStorage for edit", e);
        agents = INITIAL_AGENTS; // Fallback
      }
    } else {
      agents = INITIAL_AGENTS; // Fallback if localStorage is empty
    }
    
    const foundAgent = agents.find(a => a.id === agentId);
    
    if (foundAgent) {
      setAgentToEdit(foundAgent);
    } else {
      setError(`Agente com ID ${agentId} não encontrado.`);
    }
    setLoading(false);
  }, [agentId]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Carregando dados do agente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-destructive md:text-3xl mb-6">Erro ao Carregar Agente</h1>
        <p>{error}</p>
        <Button asChild className="mt-4">
          <Link href="/ai-content-hub/agents">Voltar para Lista de Agentes</Link>
        </Button>
      </div>
    );
  }

  if (!agentToEdit) {
     // Should be caught by error state, but as a fallback
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl mb-6">Agente não encontrado</h1>
        <p>O agente que você está tentando editar não existe ou foi movido.</p>
        <Button asChild className="mt-4">
          <Link href="/ai-content-hub/agents">Voltar para Lista de Agentes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <AgentForm initialAgentData={agentToEdit} isEditMode={true} />
    </div>
  );
}
