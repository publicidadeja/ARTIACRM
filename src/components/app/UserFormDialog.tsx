
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_ROLES } from '@/lib/constants';
import type { User, UserRole } from '@/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const userFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }).max(50),
  email: z.string().email({ message: 'Email inválido.' }),
  role: z.custom<UserRole>(val => USER_ROLES.some(r => r.value === val), {
    message: "Função inválida."
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: User | null; // User type might need id field from Firestore, will be uid from Auth
  onSave: (userData: UserFormValues, userId?: string) => Promise<void>; // onSave is now async
  isSaving?: boolean; // To disable button while saving
}

export function UserFormDialog({ open, onOpenChange, userToEdit, onSave, isSaving }: UserFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'membro',
    },
  });

  useEffect(() => {
    if (open) { // Reset form when dialog opens
      if (userToEdit) {
        form.reset({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role,
        });
      } else {
        form.reset({
          name: '',
          email: '',
          role: 'membro',
        });
      }
    }
  }, [userToEdit, form, open]);

  const handleSubmit = async (data: UserFormValues) => {
    try {
      await onSave(data, userToEdit?.id); // Use id from userToEdit which is the uid
      toast({
          title: userToEdit ? "Usuário Atualizado" : "Usuário Criado",
          description: `O usuário ${data.name} foi ${userToEdit ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onOpenChange(false);
    } catch (error: any) {
        toast({
            title: "Erro",
            description: error.message || "Não foi possível salvar o usuário.",
            variant: "destructive",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Modifique as informações do usuário.' : 'Preencha os detalhes do novo usuário.'}
            {!userToEdit && <p className="text-xs text-muted-foreground pt-1">A senha inicial deverá ser definida pelo usuário através do fluxo "Esqueceu a senha?".</p>}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Ex: joao.silva@email.com" 
                      {...field} 
                      disabled={!!userToEdit || isSaving} // Disable email if editing
                    />
                  </FormControl>
                  {userToEdit && <FormDescription className="text-xs">O email não pode ser alterado após a criação.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value} disabled={role.value === 'administrador' && userToEdit?.role !== 'administrador' && !process.env.NEXT_PUBLIC_ALLOW_MULTIPLE_ADMINS}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving? 'Salvando...' : (userToEdit ? 'Salvar Alterações' : 'Criar Usuário')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
