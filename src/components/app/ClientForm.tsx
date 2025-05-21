'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, PlusCircle, Trash2, Save, Info, Loader2, Brain, ChevronLeft } from 'lucide-react';
import type { Client, SocialMediaCredential } from '@/types';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';


const socialMediaCredentialSchema = z.object({
  id: z.string().optional(), 
  platform: z.string().min(1, { message: 'Plataforma é obrigatória.' }).max(50),
  username: z.string().min(1, { message: 'Usuário é obrigatório.' }).max(100),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }).max(100), 
  notes: z.string().max(200, { message: 'Notas não podem exceder 200 caracteres.' }).optional(),
});

const clientFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Nome da empresa deve ter pelo menos 2 caracteres.' }).max(100),
  contactName: z.string().min(2, { message: 'Nome do contato deve ter pelo menos 2 caracteres.' }).max(100),
  contactEmail: z.string().email({ message: 'Email de contato inválido.' }),
  contactPhone: z.string().max(20, { message: 'Telefone não pode exceder 20 caracteres.' }).optional().default(''),
  website: z.string().url({ message: 'Website inválido.' }).or(z.literal('')).optional().default(''),
  address: z.string().max(200, { message: 'Endereço não pode exceder 200 caracteres.' }).optional().default(''),
  notes: z.string().max(1000, { message: 'Observações gerais não podem exceder 1000 caracteres.' }).optional().default(''),
  socialMediaCredentials: z.array(socialMediaCredentialSchema).optional().default([]),
  brandProfile: z.string().max(2000, { message: 'Perfil da marca não pode exceder 2000 caracteres.' }).optional().default(''),
  targetAudience: z.string().max(2000, { message: 'Público-alvo não pode exceder 2000 caracteres.' }).optional().default(''),
  keywords: z.string().max(1000, { message: 'Palavras-chave não podem exceder 1000 caracteres.' }).optional().default(''),
  contentHistory: z.string().max(2000, { message: 'Histórico de conteúdo não pode exceder 2000 caracteres.' }).optional().default(''),
  marketingObjectives: z.string().max(2000, { message: 'Objetivos de marketing não podem exceder 2000 caracteres.' }).optional().default(''),
  restrictions: z.string().max(2000, { message: 'Restrições não podem exceder 2000 caracteres.' }).optional().default(''),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialClientData?: Client | null;
  isEditMode?: boolean;
  clientId?: string;
}

const defaultFormValues: ClientFormValues = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  address: '',
  notes: '',
  socialMediaCredentials: [],
  brandProfile: '',
  targetAudience: '',
  keywords: '',
  contentHistory: '',
  marketingObjectives: '',
  restrictions: '',
};

async function createClient(data: any) {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar cliente');
  }
  
  return response.json();
}

async function updateClient(id: string, data: any) {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar cliente');
  }
  
  return response.json();
}

export function ClientForm({ initialClientData, isEditMode = false, clientId }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: 'onChange',
    defaultValues: defaultFormValues,
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  const { fields: credentialFields, append: appendCredential, remove: removeCredential } = useFieldArray({
    control,
    name: "socialMediaCredentials",
  });

  useEffect(() => {
    // console.log("[ClientForm] useEffect triggered. isEditMode:", isEditMode, "initialClientData:", initialClientData);
    if (isEditMode && initialClientData) {
      reset({
        companyName: initialClientData.companyName || '',
        contactName: initialClientData.contactName || '',
        contactEmail: initialClientData.contactEmail || '',
        contactPhone: initialClientData.contactPhone || '',
        website: initialClientData.website || '',
        address: initialClientData.address || '',
        notes: initialClientData.notes || '',
        brandProfile: initialClientData.brandProfile || '',
        targetAudience: initialClientData.targetAudience || '',
        keywords: initialClientData.keywords || '',
        contentHistory: initialClientData.contentHistory || '',
        marketingObjectives: initialClientData.marketingObjectives || '',
        restrictions: initialClientData.restrictions || '',
        socialMediaCredentials: (initialClientData.socialMediaCredentials || []).map(cred => ({
          id: cred.id,
          platform: cred.platform,
          username: cred.username,
          password: cred.password || '',
          notes: cred.notes || '',
        }))
      });
    } else if (!isEditMode) {
      reset(defaultFormValues);
    }
  }, [isEditMode, initialClientData, reset]);

  async function onSubmit(data: ClientFormValues) {
    if (!currentUser) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para salvar clientes.", variant: "destructive" });
      return;
    }

    const formattedCredentials = (data.socialMediaCredentials || []).map((cred, index) => ({
      id: cred.id || `cred-${Date.now()}-${index}`,
      platform: cred.platform,
      username: cred.username,
      password: cred.password,
      notes: cred.notes || '',
    }));

    const clientDataToSave = {
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || '',
      website: data.website || '',
      address: data.address || '',
      notes: data.notes || '',
      socialMediaCredentials: formattedCredentials,
      brandProfile: data.brandProfile || '',
      targetAudience: data.targetAudience || '',
      keywords: data.keywords || '',
      contentHistory: data.contentHistory || '',
      marketingObjectives: data.marketingObjectives || '',
      restrictions: data.restrictions || '',
      userId: currentUser.uid,
    };

    if (isEditMode && clientId) {
      try {
        await updateClient(clientId, clientDataToSave);
        toast({
          title: 'Cliente Atualizado!',
          description: `O cliente "${data.companyName}" foi atualizado com sucesso.`,
        });
        router.push('/clients');
      } catch (error) {
        console.error("[ClientForm] Error updating client:", error);
        toast({ title: 'Erro ao atualizar', description: (error as Error).message || 'Não foi possível atualizar o cliente.', variant: 'destructive' });
      }
    } else {
      try {
        await createClient(clientDataToSave);
        toast({
          title: 'Cliente Criado!',
          description: `O cliente "${data.companyName}" foi adicionado com sucesso.`,
        });
        router.push('/clients');
      } catch (error) {
        console.error("[ClientForm] Error adding client:", error);
        toast({ title: 'Erro ao criar', description: (error as Error).message || 'Não foi possível criar o cliente.', variant: 'destructive' });
      }
    }
  }

  return (
    <>
      <Button variant="outline" asChild className="mb-4 self-start">
        <Link href="/clients">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Clientes
        </Link>
      </Button>
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? "Editar Cliente" : "Adicionar Novo Cliente"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              <section className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium text-foreground">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="companyName" render={({ field }) => (
                    <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Ex: Artia Marketing Digital" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="contactName" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Contato Principal</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email do Contato</FormLabel><FormControl><Input type="email" placeholder="Ex: contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone do Contato (Opcional)</FormLabel><FormControl><Input placeholder="Ex: (11) 99999-8888" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="website" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Website (Opcional)</FormLabel><FormControl><Input placeholder="Ex: https://www.empresa.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Endereço (Opcional)</FormLabel><FormControl><Textarea placeholder="Ex: Rua Principal, 123, Bairro, Cidade - UF" rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="notes" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Observações Gerais (Opcional)</FormLabel><FormControl><Textarea placeholder="Informações adicionais sobre o cliente, preferências, histórico, etc." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </section>

              <Separator />

              <section className="space-y-4 p-4 border rounded-md">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium text-foreground">Contexto para IA (Opcional)</h3>
                </div>
                <FormDescription>Informações que ajudarão a IA a gerar conteúdo mais alinhado com o cliente.</FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={control} name="brandProfile" render={({ field }) => (
                    <FormItem><FormLabel>Perfil da Marca</FormLabel><FormControl><Textarea placeholder="Cores, voz, tom, valores..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="targetAudience" render={({ field }) => (
                    <FormItem><FormLabel>Público-Alvo e Personas</FormLabel><FormControl><Textarea placeholder="Descrição do público-alvo, características das personas..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="keywords" render={({ field }) => (
                    <FormItem><FormLabel>Palavras-chave e Hashtags</FormLabel><FormControl><Textarea placeholder="Principais palavras-chave e hashtags relevantes..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="contentHistory" render={({ field }) => (
                    <FormItem><FormLabel>Histórico de Conteúdos</FormLabel><FormControl><Textarea placeholder="Resumo de conteúdos anteriores, temas abordados, o que funcionou..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="marketingObjectives" render={({ field }) => (
                    <FormItem><FormLabel>Objetivos de Marketing</FormLabel><FormControl><Textarea placeholder="Principais objetivos de marketing do cliente..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={control} name="restrictions" render={({ field }) => (
                    <FormItem><FormLabel>Restrições e Diretrizes</FormLabel><FormControl><Textarea placeholder="O que evitar, linguagem proibida, diretrizes específicas..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </section>

              <Separator />

              <section className="space-y-4 p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-foreground">Credenciais de Mídias Sociais</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCredential({ platform: '', username: '', password: '', notes: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Credencial
                  </Button>
                </div>

                <Alert variant="destructive" className="bg-destructive/10">
                  <ShieldAlert className="h-4 w-4 !text-destructive" />
                  <AlertTitle className="text-destructive">Atenção de Segurança!</AlertTitle>
                  <AlertDescription className="text-destructive/90">
                    Armazenar senhas diretamente no banco de dados, mesmo que hasheadas, requer cuidados extremos.
                    Esta funcionalidade é para fins de prototipagem. Em produção, considere integrações com cofres de senha ou OAuth.
                  </AlertDescription>
                </Alert>

                {credentialFields.map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-md space-y-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium text-foreground">Credencial #{index + 1}</h4>
                      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeCredential(index)}>
                        <Trash2 className="h-4 w-4" /><span className="sr-only">Remover Credencial</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={control} name={`socialMediaCredentials.${index}.platform`} render={({ field }) => (
                        <FormItem><FormLabel>Plataforma</FormLabel><FormControl><Input placeholder="Ex: Facebook, Instagram, Google Ads" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={control} name={`socialMediaCredentials.${index}.username`} render={({ field }) => (
                        <FormItem><FormLabel>Usuário/Email</FormLabel><FormControl><Input placeholder="Login da plataforma" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={control} name={`socialMediaCredentials.${index}.password`} render={({ field }) => (
                        <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="Senha de acesso" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={control} name={`socialMediaCredentials.${index}.notes`} render={({ field }) => (
                        <FormItem><FormLabel>Notas Adicionais (Opcional)</FormLabel><FormControl><Input placeholder="Ex: Código 2FA, email de recuperação" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    {errors.socialMediaCredentials?.[index] && (
                      <p className="text-sm font-medium text-destructive">
                          Verifique os erros nesta credencial.
                      </p>
                    )}
                  </div>
                ))}
                {errors.socialMediaCredentials && !errors.socialMediaCredentials.root && !Array.isArray(errors.socialMediaCredentials) && (
                  <p className="text-sm font-medium text-destructive">
                      {errors.socialMediaCredentials.message}
                  </p>
                )}
              </section>

              <CardFooter className="px-0 pt-6">
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditMode ? "Salvar Alterações do Cliente" : "Adicionar Cliente"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
