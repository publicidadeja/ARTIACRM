'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { USER_ROLES } from '@/lib/constants';
import type { User, UserRole } from '@/types';
import { UserFormDialog } from '@/components/app/UserFormDialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// API endpoints para gerenciar usuários
const API_ENDPOINTS = {
  USERS: '/api/users'
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();
  const { currentUser, isAdministrator, loading: authLoading } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!isAdministrator || !currentUser) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Buscando usuários da API em vez do Firestore
      const response = await fetch(API_ENDPOINTS.USERS);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro ao Carregar Usuários",
        description: `Não foi possível buscar os dados dos usuários. Erro: ${error.message}`,
        variant: "destructive",
        duration: 7000,
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAdministrator, currentUser, toast]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!currentUser) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    if (isAdministrator) {
      fetchUsers();
    } else {
      setUsers([]);
      setIsLoading(false);
    }
  }, [currentUser, isAdministrator, authLoading, fetchUsers]);

  const handleAddNewUser = () => {
    setUserToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    if (user.email === 'admin@artia.com' && user.id !== currentUser?.id) {
      toast({
        title: "Ação não permitida",
        description: "O administrador principal não pode ser editado por outros administradores.",
        variant: "destructive",
      });
      return;
    }
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    if (user.email === 'admin@artia.com') {
      toast({
        title: "Ação não permitida",
        description: "O administrador principal não pode ser excluído.",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete.id || !currentUser) return;
    if (userToDelete.email === 'admin@artia.com') {
      toast({ 
        title: "Ação não permitida", 
        description: "Não é possível excluir o administrador principal.", 
        variant: "destructive" 
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      // Excluindo usuário pela API
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir usuário: ${response.status}`);
      }

      toast({
        title: "Usuário Removido",
        description: `O usuário ${userToDelete.name} foi removido com sucesso.`,
      });
      fetchUsers(); // Atualizar a lista
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o usuário. Erro: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async (userData: { name: string; email: string; role: UserRole }, userIdToEdit?: string) => {
    setIsSaving(true);

    try {
      if (userIdToEdit) { // Editando usuário existente
        if (userToEdit?.email === 'admin@artia.com' && userData.role !== 'administrador') {
          toast({ 
            title: "Ação não permitida", 
            description: "A função do administrador principal não pode ser alterada.", 
            variant: "destructive" 
          });
          setIsSaving(false);
          return;
        }

        // Atualizando usuário pela API
        const response = await fetch(`${API_ENDPOINTS.USERS}/${userIdToEdit}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: userData.name,
            role: userData.role,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao atualizar usuário: ${response.status}`);
        }

      } else { // Criando novo usuário
        // Gerando uma senha padrão
        const tempPassword = 'artia123'; // Senha temporária simples para teste

        // Criando usuário pela API
        const response = await fetch(API_ENDPOINTS.USERS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: uuidv4(),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            password: tempPassword,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao criar usuário: ${response.status}`);
        }

        toast({
          title: "Usuário Criado",
          description: `Usuário ${userData.name} criado com sucesso. Senha temporária: ${tempPassword}`,
          duration: 10000,
        });
      }

      fetchUsers(); // Atualizar a lista
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      let errorMessage = "Não foi possível salvar o usuário.";
      
      if (error.message.includes("Erro ao criar usuário") || error.message.includes("Erro ao atualizar usuário")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({ 
        title: "Erro ao Salvar", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (roleValue: UserRole) => {
    return USER_ROLES.find(r => r.value === roleValue)?.label || roleValue;
  };

  // Este bloco renderiza um loader enquanto a autenticação está sendo verificada.
  if (authLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // Após a autenticação, se não for administrador, nega o acesso.
  if (!isAdministrator) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-lg text-destructive">Acesso Negado.</p>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  // Se for administrador, mas os dados dos usuários ainda estão carregando.
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  // Se for administrador e os dados foram carregados (ou a busca concluiu).
  return (
    <div className="container mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Gerenciar Usuários</h1>
        <Button onClick={handleAddNewUser} disabled={isSaving}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-card-foreground">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'administrador' ? 'default' : 'secondary'} className="capitalize">
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSaving}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditUser(user)}
                        disabled={isSaving || (user.email === 'admin@artia.com' && user.id !== currentUser?.id)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(user)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        disabled={(user.email === 'admin@artia.com' || isSaving || user.id === currentUser?.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum usuário encontrado. Adicione um novo usuário clicando no botão acima.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
        isSaving={isSaving}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover o usuário "{userToDelete?.name}"?
              <br/><br/>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSaving}>
              {isSaving? 'Excluindo...' : 'Excluir Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
