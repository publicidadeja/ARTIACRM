'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CalendarIcon, Wand2, Loader2, Info, PlusCircle, Trash2, Save, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TASK_TYPES_MARKETING, PRIORITIES, KANBAN_COLUMNS_LIST } from '@/lib/constants';
import type { Task, TaskType, Priority, User, TaskStatus, Subtask, Client } from '@/types';
import { suggestTaskDetails, type SuggestTaskDetailsInput, type SuggestTaskDetailsOutput } from '@/ai/flows/suggest-task-details';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';


const taskFormSchema = z.object({
  title: z.string().min(3, { message: 'Título deve ter pelo menos 3 caracteres.' }).max(100, { message: 'Título não pode exceder 100 caracteres.' }),
  description: z.string().max(10000, { message: 'Descrição não pode exceder 10000 caracteres.' }).optional(), // Aumentado limite
  type: z.custom<TaskType>(val => TASK_TYPES_MARKETING.some(t => t.value === val), {
    message: "Tipo de tarefa inválido."
  }),
  priority: z.custom<Priority>(val => PRIORITIES.some(p => p.value === val), {
    message: "Prioridade inválida."
  }),
  dueDate: z.date({ required_error: 'Data de prazo é obrigatória.' }),
  assignees: z.array(z.string()).min(1, { message: 'Selecione ao menos um responsável.' }),
  status: z.string().min(1, { message: "Status é obrigatório."}),
  references: z.string().max(500, { message: 'Referências não podem exceder 500 caracteres.' }).optional(),
  subtasks: z.array(
    z.object({
      id: z.string().optional(), 
      text: z.string().min(1, {message: 'Descrição da subtarefa é obrigatória.'}).max(150, {message: 'Subtarefa não pode exceder 150 caracteres.'}),
      completed: z.boolean().optional(), 
    })
  ).optional(),
  platform: z.string().optional(),
  format: z.string().optional(),
  subject: z.string().optional(),
  segment: z.string().optional(),
  expectedMetrics: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().optional(), // Manter para UI, mas não salvar diretamente se clientId existe
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface CreateTaskFormProps {
  initialTaskData?: Task | null;
  isEditMode?: boolean;
  taskId?: string; // Para modo de edição
}

const NO_CLIENT_VALUE = "---NO_CLIENT---"; 

export function CreateTaskForm({ initialTaskData, isEditMode = false, taskId }: CreateTaskFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser, isAdministrator } = useAuth();
  
  const defaultStatusFromQuery = searchParams?.get('status');
  const fromAIQuery = searchParams?.get('fromAI');
  const queryClientId = searchParams?.get('clientId');
  const queryClientName = searchParams?.get('clientName');
  
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [defaultStatus, setDefaultStatus] = useState('');
  const [initialTaskSuggestion, setInitialTaskSuggestion] = useState<SuggestTaskDetailsOutput | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: "onChange",
    defaultValues: {
      title: '',
      description: '',
      type: TASK_TYPES_MARKETING[0].value,
      priority: 'media',
      dueDate: new Date(), 
      assignees: [],
      status: KANBAN_COLUMNS_LIST.find(s => s.id === 'a_fazer')?.id || KANBAN_COLUMNS_LIST[0]?.id || '',
      references: '',
      subtasks: [],
      platform: '',
      format: '',
      subject: '',
      segment: '',
      expectedMetrics: '',
      clientId: '',
      clientName: '',
    },
  });
  
  const { control, formState: { errors, isSubmitting }, setValue, reset, watch, getValues } = form;

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;

      // Fetch Clients
      setIsLoadingClients(true);
      try {
        // Buscar clientes da API REST em vez do Firestore
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        const clientsData = await response.json();
        setClients(clientsData);
      } catch (error) {
        console.error("Erro ao buscar clientes para o formulário de tarefas:", error);
        toast({ title: "Erro ao carregar clientes", variant: "destructive" });
      } finally {
        setIsLoadingClients(false);
      }

      // Fetch Users
      setIsLoadingUsers(true);
      try {
        // Buscar usuários da API REST
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`Erro ao buscar usuários: ${response.status}`);
        }
        const usersData = await response.json();
        setAvailableUsers(usersData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast({ title: "Erro ao carregar usuários", variant: "destructive" });
        setAvailableUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }

      // Status (ainda do localStorage ou constantes)
      const storedUserColumns = localStorage.getItem('userDefinedColumns');
      let combinedStatuses: string[] = KANBAN_COLUMNS_LIST.map(column => column.id);
      
      if (storedUserColumns) {
        try {
          const userColumns = JSON.parse(storedUserColumns);
          if (Array.isArray(userColumns) && userColumns.length > 0) {
            combinedStatuses = userColumns.map((column: any) => 
              typeof column === 'string' ? column : column.id
            );
          }
        } catch (error) {
          console.error("Erro ao analisar colunas personalizadas:", error);
        }
      }
      
      setAvailableStatuses(combinedStatuses);
      
      let currentDefaultStatus = combinedStatuses[0];
      if (defaultStatusFromQuery && combinedStatuses.includes(defaultStatusFromQuery)) {
        currentDefaultStatus = defaultStatusFromQuery;
      }
      setValue('status', currentDefaultStatus);

      // Configurar descrição inicial se o AI request estiver disponível
      let initialDescription = '';
      
      if (fromAIQuery === 'true' && localStorage.getItem('artiaTaskAISuggestion')) {
        try {
          const aiSuggestion = JSON.parse(localStorage.getItem('artiaTaskAISuggestion') || '{}');
          initialDescription = aiSuggestion.suggestedDescription || '';
          setValue('description', initialDescription);
        } catch (error) {
          console.error("Erro ao processar sugestão da IA:", error);
        }
      }
      
      // Valor padrão para Nome do cliente
      let defaultClientId = queryClientId || '';
      let defaultClientName = '';
      
      if (defaultClientId && clients.length > 0) {
        const foundClient = clients.find(c => c.id === defaultClientId);
        if (foundClient) {
          defaultClientName = foundClient.companyName;
        }
      } else if (queryClientName) {
        defaultClientName = queryClientName;
      }

      if (isEditMode && initialTaskData) {
        reset({
          ...initialTaskData,
          dueDate: parseISO(initialTaskData.dueDate),
          assignees: initialTaskData.assignees.map(a => a.id),
          subtasks: initialTaskData.subtasks?.map(st => ({ id: st.id, text: st.text, completed: st.completed || false })) || [],
          // Garantir que campos opcionais sejam strings vazias se nulos/undefined
          description: initialTaskData.description || '',
          references: initialTaskData.references || '',
          platform: initialTaskData.platform || '',
          format: initialTaskData.format || '',
          subject: initialTaskData.subject || '',
          segment: initialTaskData.segment || '',
          expectedMetrics: initialTaskData.expectedMetrics || '',
          clientId: initialTaskData.clientId || '',
          clientName: initialTaskData.clientName || '',
        });
      } else {
        reset({ // Reset to new task defaults
          title: '',
          description: initialDescription,
          type: TASK_TYPES_MARKETING[0].value,
          priority: 'media',
          dueDate: new Date(), 
          assignees: [],
          status: currentDefaultStatus,
          references: '',
          subtasks: [],
          platform: '',
          format: '',
          subject: '',
          segment: '',
          expectedMetrics: '',
          clientId: defaultClientId,
          clientName: defaultClientName,
        });
      }
    }
    fetchData();
  }, [currentUser, isEditMode, initialTaskData, reset, defaultStatusFromQuery, fromAIQuery, queryClientId, queryClientName, toast]);


  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control,
    name: "subtasks",
  });
  
  const selectedTaskType = watch('type');

  async function onSubmit(data: TaskFormValues) {
    if (!currentUser) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para gerenciar tarefas.", variant: "destructive" });
      return;
    }
    
    const assigneesData = availableUsers.filter(member => data.assignees.includes(member.id))
        .map(u => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl || '', role: u.role })); // Mapear para estrutura User simplificada
    
    const clientForTask = clients.find(c => c.id === data.clientId);

    const taskDataPayload = {
      ...data,
      dueDate: data.dueDate.toISOString(),
      assignees: assigneesData,
      status: data.status as TaskStatus,
      clientId: data.clientId === NO_CLIENT_VALUE ? '' : data.clientId,
      clientName: data.clientId === NO_CLIENT_VALUE ? '' : clientForTask?.companyName || '',
      description: data.description || '', 
      references: data.references || '',
      platform: data.platform || '',
      format: data.format || '',
      subject: data.subject || '',
      segment: data.segment || '',
      expectedMetrics: data.expectedMetrics || '',
      subtasks: (data.subtasks || []).map((st, index) => ({
        id: st.id || `subtask-${Date.now()}-${index}`,
        text: st.text,
        completed: st.completed || false,
      })),
    };
    
    try {
      if (isEditMode && taskId) {
        // Atualizar tarefa via API
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskDataPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao atualizar tarefa: ${response.status}`);
        }
        
        toast({
          title: 'Tarefa Atualizada!',
          description: `A tarefa "${taskDataPayload.title}" foi atualizada com sucesso.`,
        });
        router.push(`/tasks/${taskId}`);
      } else {
        // Criar nova tarefa via API
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskDataPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao criar tarefa: ${response.status}`);
        }
        
        const createdTask = await response.json();
        
        toast({
          title: 'Tarefa Criada com Sucesso!',
          description: `A tarefa "${taskDataPayload.title}" foi criada.`,
        });
        router.push(`/tasks/${createdTask.id}`);
      }
    } catch (error: any) {
      console.error("Erro ao salvar tarefa:", error);
      toast({ 
        title: "Erro ao Salvar Tarefa", 
        description: error.message || "Não foi possível salvar a tarefa.", 
        variant: "destructive" 
      });
    }
  }

  const handleAISuggestions = async () => {
    const description = getValues('description');
    const title = getValues('title');
    const taskContentForAI = title + (description ? `\n${description}` : '');

    if (!taskContentForAI.trim()) {
      toast({ title: 'IA Assistente', description: 'Por favor, insira um título ou descrição para a tarefa.', variant: 'destructive' });
      return;
    }

    setIsAILoading(true);
    try {
      const input: SuggestTaskDetailsInput = {
        taskDescription: taskContentForAI,
        teamMembers: availableUsers.map(m => m.name),
      };
      const suggestions: SuggestTaskDetailsOutput = await suggestTaskDetails(input);
      
      if (suggestions.priority) {
        const priorityMap = { 'Alta': 'alta', 'Media': 'media', 'Baixa': 'baixa' };
        const suggestedPriorityValue = priorityMap[suggestions.priority as keyof typeof priorityMap] || 'media';
        setValue('priority', suggestedPriorityValue as Priority);
      }

      if (suggestions.assignees && suggestions.assignees.length > 0) {
        const assigneeIds = availableUsers
          .filter(member => suggestions.assignees.includes(member.name))
          .map(member => member.id);
        if (assigneeIds.length > 0) setValue('assignees', assigneeIds);
      }
       toast({ title: 'IA Assistente', description: 'Sugestões de prioridade e responsáveis aplicadas!' });
    } catch (error: any) {
      console.error('Error fetching AI suggestions:', error);
      toast({ title: 'Erro da IA', description: error.message || 'Não foi possível obter sugestões da IA.', variant: 'destructive' });
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{isEditMode ? "Editar Tarefa de Marketing" : "Criar Nova Tarefa de Marketing"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Título da Tarefa</FormLabel><FormControl><Input placeholder="Ex: Criar posts para campanha de Dia das Mães" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <div className="flex justify-between items-center"><FormLabel>Descrição</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={handleAISuggestions} disabled={isAILoading}>
                      {isAILoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Sugerir com IA
                    </Button>
                  </div>
                  <FormControl><Textarea placeholder="Detalhe a tarefa..." className="resize-none" rows={5} {...field} value={field.value || ''}/></FormControl><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="clientId" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-primary"/>Cliente (Opcional)</FormLabel>
                    <Select 
                      onValueChange={(valueFromSelect) => field.onChange(valueFromSelect === NO_CLIENT_VALUE ? '' : valueFromSelect)} 
                      value={field.value || NO_CLIENT_VALUE}
                      disabled={isLoadingClients}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder={isLoadingClients ? "Carregando clientes..." : "Selecione um cliente"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={NO_CLIENT_VALUE}>Nenhum cliente</SelectItem>
                        {clients.map(client => (<SelectItem key={client.id} value={client.id!}>{client.companyName}</SelectItem>))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Tarefa</FormLabel>
                  <Select onValueChange={(value: TaskType) => field.onChange(value)} value={field.value} >
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent>{TASK_TYPES_MARKETING.map(type => (<SelectItem key={type.value} value={type.value}><div className="flex items-center"><type.icon className="mr-2 h-4 w-4 text-muted-foreground" />{type.label}</div></SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a prioridade" /></SelectTrigger></FormControl>
                    <SelectContent>{PRIORITIES.map(priority => (<SelectItem key={priority.value} value={priority.value}><div className="flex items-center"><span className={`mr-2 h-2 w-2 rounded-full ${priority.colorClass}`} />{priority.label}</div></SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                    <SelectContent>{availableStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              {selectedTaskType === TASK_TYPES_MARKETING.find(t => t.value === 'Posts para redes sociais')?.value && (
                <><FormField control={form.control} name="platform" render={({ field }) => (<FormItem><FormLabel>Plataforma</FormLabel><FormControl><Input placeholder="Ex: Instagram, TikTok" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="format" render={({ field }) => (<FormItem><FormLabel>Formato</FormLabel><FormControl><Input placeholder="Ex: Carrossel, Reels, Story" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>
                </>
              )}
              {selectedTaskType === TASK_TYPES_MARKETING.find(t => t.value === 'Campanhas de email marketing')?.value && (
                <><FormField control={form.control} name="subject" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Assunto do Email</FormLabel><FormControl><Input placeholder="Ex: Novidades da Semana!" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="segment" render={({ field }) => (<FormItem><FormLabel>Segmento</FormLabel><FormControl><Input placeholder="Ex: Clientes VIP, Leads Inativos" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="expectedMetrics" render={({ field }) => (<FormItem><FormLabel>Métricas Esperadas</FormLabel><FormControl><Input placeholder="Ex: Taxa de Abertura 20%, CTR 5%" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)}/>
                </>
              )}
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data de Prazo</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                      <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                        {field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha uma data</span>)}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus locale={ptBR}/></PopoverContent>
                  </Popover><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="assignees" render={() => ( 
                <FormItem className="md:col-span-2">
                  <div className="mb-2"><FormLabel>Responsáveis</FormLabel><FormDescription className="flex items-center gap-1 text-xs"><Info size={13}/> Marque os membros da equipe.</FormDescription></div>
                    {isLoadingUsers ? (<div className="text-sm text-muted-foreground p-4 border rounded-md">Carregando usuários...</div>) 
                    : availableUsers.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 rounded-md border p-4 max-h-60 overflow-y-auto">
                        {availableUsers.map((member) => (<FormField key={member.id} control={form.control} name="assignees"
                            render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl><Checkbox checked={field.value?.includes(member.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked ? field.onChange([...currentValue, member.id]) : field.onChange(currentValue.filter((value) => value !== member.id));
                                    }}/></FormControl><FormLabel className="font-normal text-sm whitespace-nowrap">{member.name}</FormLabel></FormItem>)}/>
                        ))}</div>) 
                    : (<p className="text-sm text-muted-foreground p-4 border rounded-md">Nenhum usuário cadastrado. Adicione usuários em "Gerenciar Usuários".</p>)}
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="references" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Referências de Arquivos</FormLabel><FormControl>
                    <Textarea placeholder="Links ou descrições de arquivos de referência..." className="resize-none" rows={3} {...field} value={field.value || ''}/>
                  </FormControl><FormMessage />
                </FormItem>
              )}/>
            </div>
            <Separator className="my-6" />
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-lg font-medium text-foreground">Checklist (Subtarefas)</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => appendSubtask({ text: '', completed: false })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Subtarefa
                </Button>
              </div>
              {subtaskFields.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <FormField control={control} name={`subtasks.${index}.text`} render={({ field }) => (
                      <FormItem className="flex-grow"><FormControl><Input {...field} placeholder={`Subtarefa ${index + 1}`} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  {isEditMode && ( 
                    <FormField control={control} name={`subtasks.${index}.completed`} render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                          <FormLabel className="text-xs font-normal">Concluída</FormLabel></FormItem>)}/>)}
                  <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeSubtask(index)}>
                    <Trash2 className="h-4 w-4" /><span className="sr-only">Remover subtarefa</span>
                  </Button>
                </div>
              ))}
              {errors.subtasks && !errors.subtasks.root && !errors.subtasks.message && (<p className="text-sm font-medium text-destructive">Verifique os erros nas subtarefas.</p>)}
              {errors.subtasks?.root?.message && (<p className="text-sm font-medium text-destructive">{errors.subtasks.root.message}</p>)}
            </div>
            <CardFooter className="px-0 pt-6">
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Save className="mr-2 h-4 w-4" /> : null)}
                {isEditMode ? "Salvar Alterações" : "Criar Tarefa"}
                </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
