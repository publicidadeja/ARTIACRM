'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Briefcase, KeyRound, Eye, Loader2 } from 'lucide-react';
import type { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ManageClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchClients() {
      if (status === 'loading') {
        setIsLoading(true); 
        return;
      }
      if (status !== 'authenticated' || !session?.user) {
        setClients([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Buscar clientes da API REST
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const clientsData = await response.json();
        setClients(clientsData);
      } catch (error: any) {
        console.error("Erro ao carregar clientes:", error);
        toast({ 
            title: "Erro ao Carregar Clientes", 
            description: `Não foi possível buscar os dados dos clientes. ${error.message}`, 
            variant: "destructive",
            duration: 7000,
        });
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, [session, status, toast]);

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete || !clientToDelete.id || !session?.user) return;
    
    if (clientToDelete.userId !== session.user.id) {
        toast({ title: "Ação não permitida", description: "Você não pode excluir este cliente.", variant: "destructive"});
        setIsDeleteDialogOpen(false);
        setClientToDelete(null);
        return;
    }

    try {
      // Usar API REST para excluir o cliente
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir cliente: ${response.status}`);
      }
      
      setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
      toast({
        title: "Cliente Excluído",
        description: `O cliente ${clientToDelete.companyName} foi excluído com sucesso.`,
      });
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      toast({ 
        title: "Erro ao excluir", 
        description: `Não foi possível excluir o cliente. ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  if (isLoading) { 
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl flex items-center">
          <Briefcase className="mr-3 h-7 w-7 text-primary" /> Gerenciar Clientes
        </h1>
        <Button asChild>
          <Link href="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Cliente
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Credenciais de Mídia</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? clients.map(client => (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-card-foreground">
                  <Link href={`/clients/${client.id}`} className="hover:underline text-primary">
                    {client.companyName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.contactName}</TableCell>
                <TableCell className="text-muted-foreground">{client.contactEmail}</TableCell>
                <TableCell className="text-muted-foreground">
                  {client.website ? (
                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {client.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {client.socialMediaCredentials && client.socialMediaCredentials.length > 0 ? (
                    <div className="flex flex-col space-y-1 max-w-xs">
                      {client.socialMediaCredentials.slice(0, 2).map(cred => ( 
                        <Badge key={cred.id} variant="secondary" className="text-xs p-1 justify-start">
                          <KeyRound className="h-3 w-3 mr-1.5 shrink-0" />
                          <span className="font-semibold truncate max-w-[80px]">{cred.platform}:</span> 
                          <span className="ml-1 truncate max-w-[100px]">{cred.username}</span>
                        </Badge>
                      ))}
                      {client.socialMediaCredentials.length > 2 && (
                        <span className="text-xs text-muted-foreground mt-1">+ {client.socialMediaCredentials.length - 2} mais...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhuma</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações do cliente</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteDialog(client)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado. Adicione um novo cliente para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o cliente "{clientToDelete?.companyName}"? Todas as informações associadas serão perdidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
