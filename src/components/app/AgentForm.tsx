
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bot, ChevronLeft } from 'lucide-react';
import type { AIAgent, AgentSpecialization } from '@/types';
import { INITIAL_AGENTS, AgentSpecializationsList } from '@/lib/constants';
import Link from 'next/link';

const agentFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome do agente deve ter pelo menos 3 caracteres.' }).max(50),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres.' }).max(300),
  avatarUrl: z.string().url({ message: 'URL do avatar inválida.' }).or(z.literal('')).optional(),
  specialization: z.custom<AgentSpecialization>(val => AgentSpecializationsList.some(spec => spec.value === val), {
    message: "Especialização inválida."
  }),
  personalityStyle: z.string().min(10, { message: 'Personalidade/Estilo deve ter pelo menos 10 caracteres.' }).max(500),
  basePrompt: z.string().min(20, { message: 'Prompt base deve ter pelo menos 20 caracteres.' }).max(5000),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  initialAgentData?: AIAgent | null;
  isEditMode?: boolean;
}

export function AgentForm({ initialAgentData, isEditMode = false }: AgentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      avatarUrl: '',
      specialization: AgentSpecializationsList[0].value,
      personalityStyle: '',
      basePrompt: '',
    },
  });

  const { control, handleSubmit, formState: { isSubmitting }, reset } = form;
  
  useEffect(() => {
    if (isEditMode && initialAgentData) {
      reset({
        name: initialAgentData.name,
        description: initialAgentData.description,
        avatarUrl: initialAgentData.avatarUrl || '',
        specialization: initialAgentData.specialization,
        personalityStyle: initialAgentData.personalityStyle,
        basePrompt: initialAgentData.basePrompt,
      });
    } else if (!isEditMode) {
        reset({ // Reset to default for new agent if not in edit mode
            name: '',
            description: '',
            avatarUrl: '',
            specialization: AgentSpecializationsList[0].value,
            personalityStyle: '',
            basePrompt: '',
        });
    }
  }, [isEditMode, initialAgentData, reset]);


  async function onSubmit(data: AgentFormValues) {
    const storedAgents = localStorage.getItem('artiaAiAgents');
    let agents: AIAgent[] = storedAgents ? JSON.parse(storedAgents) : [];

    if (isEditMode && initialAgentData) {
      const agentIndex = agents.findIndex(agent => agent.id === initialAgentData.id);
      if (agentIndex > -1) {
        agents[agentIndex] = { ...agents[agentIndex], ...data, avatarUrl: data.avatarUrl || undefined };
        toast({ title: 'Agente Atualizado!', description: `O agente "${data.name}" foi atualizado.` });
      } else {
        toast({ title: 'Erro ao Atualizar', description: 'Agente não encontrado para atualização.', variant: 'destructive' });
        return;
      }
    } else {
      const newAgentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newAgent: AIAgent = {
        id: newAgentId,
        ...data,
        avatarUrl: data.avatarUrl || undefined,
      };
      agents.unshift(newAgent);
      toast({ title: 'Agente Criado!', description: `O agente "${data.name}" foi criado com sucesso.` });
    }

    localStorage.setItem('artiaAiAgents', JSON.stringify(agents));
    router.push('/ai-content-hub/agents');
  }

  return (
    <div className="max-w-3xl mx-auto">
        <Button variant="outline" asChild className="mb-4">
            <Link href="/ai-content-hub/agents">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Agentes
            </Link>
        </Button>
      <Card className="shadow-xl">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Bot className="mr-3 h-7 w-7 text-primary" />
                {isEditMode ? 'Editar Agente de IA' : 'Criar Novo Agente de IA'}
              </CardTitle>
              <CardDescription>
                Defina as características e o comportamento do seu assistente de IA especializado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Agente</FormLabel>
                    <FormControl><Input placeholder="Ex: Redator Criativo de E-mails" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Curta</FormLabel>
                    <FormControl><Textarea placeholder="Qual o propósito principal deste agente?" rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Avatar (Opcional)</FormLabel>
                    <FormControl><Input placeholder="https://exemplo.com/avatar.png" {...field} value={field.value || ''} /></FormControl>
                    <FormDescription>Use uma URL de imagem para o avatar do agente. Se deixado em branco, um padrão será usado.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área de Especialização</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a especialização" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {AgentSpecializationsList.map(spec => (
                          <SelectItem key={spec.value} value={spec.value}>{spec.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="personalityStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personalidade e Estilo de Comunicação</FormLabel>
                    <FormControl><Textarea placeholder="Ex: Amigável e informal, com uso de emojis. Ou: Técnico, direto e formal." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="basePrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Base (Instruções Fundamentais)</FormLabel>
                    <FormControl><Textarea placeholder="Descreva detalhadamente como o agente deve se comportar, o que ele deve fazer, qual seu objetivo principal, e qualquer regra ou formato de saída esperado. Use placeholders como [tema] ou [cliente] que serão substituídos em tempo de uso." rows={8} {...field} /></FormControl>
                    <FormDescription>Este é o coração do agente. Seja específico sobre o que você espera.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditMode ? 'Salvar Alterações do Agente' : 'Criar Agente'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
