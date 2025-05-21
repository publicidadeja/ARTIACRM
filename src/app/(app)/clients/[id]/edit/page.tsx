'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClientForm } from '@/components/app/ClientForm';
import type { Client } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { data: session, status } = useSession();

  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientForEdit() {
      if (status === 'loading') {
        setLoading(true); // Keep loading if auth is still in progress
        return;
      }
      if (status !== 'authenticated' || !session?.user || !clientId) {
        setError("ID do cliente ou usuário não fornecido.");
        setLoading(false);
        return;
      }

      setLoading(true); // Start loading client data
      try {
        // Usar API REST para buscar cliente
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar cliente: ${response.status}`);
        }
        
        const clientData = await response.json();
        
        if (clientData.userId !== session.user.id) {
          setError("Você não tem permissão para editar este cliente.");
          setClientToEdit(null);
        } else {
          setClientToEdit(clientData);
        }
      } catch (e) {
        console.error("[EditClientPage] Error fetching client for edit:", e);
        setError("Não foi possível carregar os dados do cliente para edição.");
        setClientToEdit(null);
      } finally {
        setLoading(false);
      }
    }
    fetchClientForEdit();
  }, [clientId, session, status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto py-10 text-center flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-destructive md:text-3xl mb-6">Erro ao Carregar Cliente</h1>
        <p>{error}</p>
        <Button asChild className="mt-4">
          <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista de Clientes</Link>
        </Button>
      </div>
    );
  }

  if (!clientToEdit) { // Handles case where client is not found or permission denied after loading
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl mb-6">Cliente não encontrado</h1>
        <p>O cliente que você está tentando editar não existe ou foi movido.</p>
        <Button asChild className="mt-4">
          <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista de Clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2 flex flex-col">
      <ClientForm initialClientData={clientToEdit} isEditMode={true} clientId={clientId} />
    </div>
  );
}
