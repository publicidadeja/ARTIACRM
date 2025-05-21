'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Client, SocialMediaCredential } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Home, 
  FileText, 
  KeyRound, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  Info,
  Loader2,
  Brain,
  Palette,
  Users2,
  Hash,
  History,
  Target,
  Lock
} from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const clientId = params.id as string;
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchClient() {
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
          setError("Você não tem permissão para visualizar este cliente.");
          setClient(null);
        } else {
          setClient(clientData);
        }
      } catch (e) {
        console.error("[ClientDetailPage] Error fetching client:", e);
        setError("Não foi possível carregar os dados do cliente.");
        setClient(null);
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [clientId, session, status]);

  const handleDeleteClient = async () => {
    if (!client || !client.id || !session?.user || client.userId !== session.user.id) {
        toast({ title: "Ação não permitida", variant: "destructive" });
        return;
    }

    try {
      // Usar API REST para excluir o cliente
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir cliente: ${response.status}`);
      }
      
      toast({
        title: "Cliente Excluído",
        description: `O cliente ${client.companyName} foi excluído com sucesso.`,
      });
      router.push('/clients');
    } catch (e) {
      console.error("[ClientDetailPage] Error deleting client:", e);
      toast({ title: "Erro ao excluir", description: (e as Error).message || "Não foi possível excluir o cliente.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

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
          <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar para Lista de Clientes</Link>
        </Button>
      </div>
    );
  }

  if (!client) { // Handles case where client is not found or permission denied after loading
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl mb-6">Cliente não encontrado</h1>
        <p>O cliente que você está tentando visualizar não existe ou você não tem permissão.</p>
        <Button asChild className="mt-4">
          <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar para Lista de Clientes</Link>
        </Button>
      </div>
    );
  }
  
  const aiContextFields = [
    { label: "Perfil da Marca", value: client.brandProfile, icon: Palette },
    { label: "Público-Alvo", value: client.targetAudience, icon: Users2 },
    { label: "Palavras-chave/Hashtags", value: client.keywords, icon: Hash },
    { label: "Histórico de Conteúdo", value: client.contentHistory, icon: History },
    { label: "Objetivos de Marketing", value: client.marketingObjectives, icon: Target },
    { label: "Restrições/Diretrizes", value: client.restrictions, icon: Lock },
  ];

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" asChild>
            <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar para Clientes</Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href={`/clients/${client.id}/edit`}><Edit3 className="mr-2 h-4 w-4" /> Editar</Link>
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-3xl flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            {client.companyName}
          </CardTitle>
          <CardDescription>Detalhes completos do cliente e credenciais de mídia.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex items-start">
                <User className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                <div><strong className="block text-foreground">Contato Principal:</strong> <span className="text-muted-foreground">{client.contactName || '-'}</span></div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                <div><strong className="block text-foreground">Email:</strong> <span className="text-muted-foreground">{client.contactEmail || '-'}</span></div>
              </div>
              {client.contactPhone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                  <div><strong className="block text-foreground">Telefone:</strong> <span className="text-muted-foreground">{client.contactPhone}</span></div>
                </div>
              )}
              {client.website && (
                <div className="flex items-start">
                  <Globe className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                  <div><strong className="block text-foreground">Website:</strong> <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{client.website}</a></div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start md:col-span-2">
                  <Home className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                  <div><strong className="block text-foreground">Endereço:</strong> <span className="text-muted-foreground">{client.address}</span></div>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {client.notes && (
            <>
            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Observações Gerais</h3>
              <div className="flex items-start">
                <FileText className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </div>
            </section>
            <Separator />
            </>
          )}

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                Contexto para IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {aiContextFields.map(field => field.value ? (
                    <div key={field.label} className="flex items-start">
                        <field.icon className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                            <strong className="block text-foreground">{field.label}:</strong>
                            <p className="text-muted-foreground whitespace-pre-wrap">{field.value}</p>
                        </div>
                    </div>
                ) : null)}
                 {aiContextFields.every(field => !field.value) && (
                    <p className="text-sm text-muted-foreground md:col-span-2">Nenhum contexto para IA preenchido para este cliente.</p>
                )}
            </div>
          </section>
          
          <Separator />

          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">Credenciais de Mídias Sociais</h3>
            {client.socialMediaCredentials && client.socialMediaCredentials.length > 0 ? (
              <div className="space-y-4">
                {client.socialMediaCredentials.map((cred: SocialMediaCredential) => (
                  <Card key={cred.id} className="bg-muted/30 p-4">
                    <CardHeader className="p-0 pb-2 mb-2 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-accent" />
                        {cred.platform}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2 text-sm">
                       <p><strong className="text-foreground">Usuário:</strong> <span className="text-muted-foreground">{cred.username}</span></p>
                       {/* A senha não é exibida aqui por segurança */}
                       {cred.notes && <p className="flex items-start"><Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" /><strong className="text-foreground">Notas:</strong> <span className="ml-1 text-muted-foreground whitespace-pre-wrap">{cred.notes}</span></p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma credencial de mídia social cadastrada para este cliente.</p>
            )}
          </section>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o cliente "{client?.companyName}"? Todas as informações associadas serão perdidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
