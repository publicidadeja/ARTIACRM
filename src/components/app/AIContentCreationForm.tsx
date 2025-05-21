'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Sparkles, Copy, RotateCcw, Info, Briefcase, Palette, Users2, FileText, BarChart3, Lock, CheckSquare, Target, Hash, History, MessageCircle, ListChecks, LanguagesIcon, Edit, Maximize, Minimize, SearchCode, Type, Send, RefreshCcw, Pencil, Paperclip, MessageSquarePlus } from 'lucide-react';
import { generateCreativeContent, type GenerateCreativeContentInput, type GenerateCreativeContentOutput } from '@/ai/flows/generate-creative-content-flow';
import type { Client, CreativeContentTypeValue, ToneOfVoiceValue, ContentLengthValue, SocialPlatformValue, ClientContextConfig, ContentFormatValue, LanguageValue, AIAgent, Task, Attachment, Comment as CommentType, User, GeneratedContentItem } from '@/types';
import { CreativeContentTypes, TonesOfVoice, ContentLengths, SocialPlatforms, ContentFormats, Languages, INITIAL_AGENTS } from '@/lib/constants';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionContent, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';


const aiContentFormSchema = z.object({
  clientId: z.string().optional(),
  instructions: z.string().min(1, { message: 'As instruções devem ter pelo menos 1 caractere.' }).max(5000), // Usado se não houver agente ou como base do agente
  userSpecificQuery: z.string().optional().describe("Instruções específicas do usuário quando um agente está ativo."), // Novo campo
  contentType: z.custom<CreativeContentTypeValue>(val => Object.values(CreativeContentTypes).some(type => type.value === val), {
    message: "Tipo de conteúdo inválido."
  }),
  socialPlatform: z.custom<SocialPlatformValue>().optional(),
  toneOfVoice: z.custom<ToneOfVoiceValue>(val => Object.values(TonesOfVoice).some(tone => tone.value === val), {
    message: "Tom de voz inválido."
  }),
  contentLengthValue: z.number().min(0).max(100).default(50),
  specificDataToInclude: z.string().max(500).optional().describe("Estatísticas, citações, etc."),
  contentFormat: z.custom<ContentFormatValue>(val => Object.values(ContentFormats).some(format => format.value === val), {
    message: "Formato de conteúdo inválido."
  }),
  language: z.custom<LanguageValue>(val => Object.values(Languages).some(lang => lang.value === val), {
    message: "Idioma inválido."
  }),
  clientContextConfig: z.object({
    useBrandProfile: z.boolean().default(true),
    useTargetAudience: z.boolean().default(true),
    useKeywords: z.boolean().default(true),
    useContentHistory: z.boolean().default(false),
    useMarketingObjectives: z.boolean().default(true),
    useRestrictions: z.boolean().default(true),
  }).default({
    useBrandProfile: true,
    useTargetAudience: true,
    useKeywords: true,
    useContentHistory: false,
    useMarketingObjectives: true,
    useRestrictions: true,
  }),
});

// Schema para o formulário do diálogo de integração de tarefas
const taskIntegrationFormSchema = z.object({
  taskId: z.string().min(1, { message: 'Selecione uma tarefa.' }),
});

type TaskIntegrationFormValues = z.infer<typeof taskIntegrationFormSchema>;
type AIContentFormValues = z.infer<typeof aiContentFormSchema>;

const NO_CLIENT_VALUE = "---NO_CLIENT---";

export function AIContentCreationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<string[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<AIContentFormValues | null>(null);
  const [refineInstructions, setRefineInstructions] = useState('');
  const [isRefineDialogOpen, setIsRefineDialogOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AIAgent | null>(null);

  const [isTaskIntegrationDialogOpen, setIsTaskIntegrationDialogOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskIdForIntegration, setSelectedTaskIdForIntegration] = useState<string | undefined>(undefined);
  const [taskIntegrationMode, setTaskIntegrationMode] = useState<'comment' | 'attachment' | null>(null);
  
  const form = useForm<AIContentFormValues>({
    resolver: zodResolver(aiContentFormSchema),
    defaultValues: {
      clientId: NO_CLIENT_VALUE,
      instructions: '',
      userSpecificQuery: '',
      contentType: CreativeContentTypes.SOCIAL_MEDIA_POST.value,
      socialPlatform: SocialPlatforms.INSTAGRAM.value,
      toneOfVoice: TonesOfVoice.CASUAL.value,
      contentLengthValue: 50,
      contentFormat: ContentFormats.PARAGRAPH.value,
      language: Languages.PT_BR.value,
      specificDataToInclude: '',
      clientContextConfig: {
        useBrandProfile: true,
        useTargetAudience: true,
        useKeywords: true,
        useContentHistory: false,
        useMarketingObjectives: true,
        useRestrictions: true,
      }
    },
  });

  const { control, handleSubmit: handleFormSubmit, watch, setValue, getValues, reset } = form; 
  const watchedContentType = watch('contentType');
  const watchedClientId = watch('clientId');
  const agentIdFromQuery = searchParams.get('agentId');

  // Formulário para o diálogo de integração de tarefas
  const taskIntegrationForm = useForm<TaskIntegrationFormValues>({
    resolver: zodResolver(taskIntegrationFormSchema),
    defaultValues: {
      taskId: '',
    },
  });

  useEffect(() => {
    async function fetchClients() {
      if (!currentUser) return;
      
      setIsLoadingClients(true);
      try {
        // Buscar clientes da API em vez do Firestore
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }
        
        const clientsData = await response.json();
        setClients(clientsData);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({
          title: "Erro ao Carregar Clientes",
          description: "Não foi possível obter a lista de clientes.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingClients(false);
      }
    }
    
    fetchClients();
  }, [currentUser, toast]);

  useEffect(() => {
    const contentToReuseString = localStorage.getItem('artiaContentToReuse');
    let agentToLoad: AIAgent | null = null;

    if (agentIdFromQuery) {
      const storedAgents = localStorage.getItem('artiaAiAgents'); 
      const agentsList: AIAgent[] = storedAgents ? JSON.parse(storedAgents) : INITIAL_AGENTS;
      agentToLoad = agentsList.find(a => a.id === agentIdFromQuery) || null;
      if (agentToLoad) {
        setActiveAgent(agentToLoad);
        setValue('instructions', agentToLoad.basePrompt); // Preenche o campo principal com o basePrompt
        setValue('userSpecificQuery', ''); // Limpa o campo de query específica
        toast({ title: `Agente ${agentToLoad.name} carregado!`, description: "O prompt base do agente foi definido. Adicione seu pedido específico abaixo." });
      }
    } else {
        setActiveAgent(null); // Garante que não há agente ativo se não houver ID na query
    }
    
    if (contentToReuseString) {
      try {
        const contentToReuse: GeneratedContentItem = JSON.parse(contentToReuseString);
        
        // Se o conteúdo reutilizado tinha um agente, tenta recarregá-lo
        if (contentToReuse.agentUsed) {
            const storedAgents = localStorage.getItem('artiaAiAgents');
            const agentsList: AIAgent[] = storedAgents ? JSON.parse(storedAgents) : INITIAL_AGENTS;
            agentToLoad = agentsList.find(a => a.id === contentToReuse.agentUsed!.id) || null;
            if(agentToLoad) setActiveAgent(agentToLoad);
        }

        reset({
          clientId: contentToReuse.clientId || NO_CLIENT_VALUE,
          instructions: agentToLoad ? agentToLoad.basePrompt : contentToReuse.originalInstructions, // Se agente, usa basePrompt, senão, instruções originais
          userSpecificQuery: agentToLoad ? contentToReuse.originalInstructions.replace(agentToLoad.basePrompt, '').trim() : '', // Tenta extrair a query específica
          contentType: contentToReuse.contentType,
          socialPlatform: contentToReuse.socialPlatform,
          toneOfVoice: contentToReuse.toneOfVoice,
          contentLengthValue: contentToReuse.contentLengthValue,
          specificDataToInclude: contentToReuse.specificDataToInclude || '',
          contentFormat: contentToReuse.contentFormat,
          language: contentToReuse.language,
          clientContextConfig: contentToReuse.clientContextConfig,
        });

        setGeneratedContent(null);
        setGeneratedSuggestions(null);
        toast({ title: "Conteúdo Carregado para Reutilização", description: "Ajuste os parâmetros e gere novamente." });
      } catch(e) {
        console.error("Erro ao carregar conteúdo para reutilização:", e);
        toast({ title: "Erro ao Reutilizar", description: "Não foi possível carregar os dados do conteúdo.", variant: "destructive"});
      } finally {
        localStorage.removeItem('artiaContentToReuse');
      }
    } else if (agentToLoad) { // Se apenas um agente foi carregado (sem reutilização)
        setValue('instructions', agentToLoad.basePrompt);
        setValue('userSpecificQuery', '');
    }


  }, [agentIdFromQuery, setValue, toast, reset]);


  useEffect(() => {
    if (watchedClientId && watchedClientId !== NO_CLIENT_VALUE) {
      const client = clients.find(c => c.id === watchedClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [watchedClientId, clients]);

  function mapSliderToContentLengthType(value: number): ContentLengthValue {
    if (value < 20) return ContentLengths.VERY_SHORT.value;
    if (value < 40) return ContentLengths.SHORT.value;
    if (value < 70) return ContentLengths.MEDIUM.value;
    if (value < 90) return ContentLengths.LONG.value;
    return ContentLengths.VERY_LONG.value;
  }

  async function onSubmit(data: AIContentFormValues, additionalInstructions?: string) {
    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedSuggestions(null);
    setLastSubmittedData(data); 

    const clientContextForAI = selectedClient ? {
        brandProfile: data.clientContextConfig.useBrandProfile ? selectedClient.brandProfile : undefined,
        targetAudience: data.clientContextConfig.useTargetAudience ? selectedClient.targetAudience : undefined,
        keywords: data.clientContextConfig.useKeywords ? selectedClient.keywords : undefined,
        contentHistory: data.clientContextConfig.useContentHistory ? selectedClient.contentHistory : undefined,
        marketingObjectives: data.clientContextConfig.useMarketingObjectives ? selectedClient.marketingObjectives : undefined,
        restrictions: data.clientContextConfig.useRestrictions ? selectedClient.restrictions : undefined,
    } : {};

    let finalInstructions = data.instructions; // Campo principal de instruções
    
    if (activeAgent) {
        // Usa o basePrompt do agente e adiciona a query específica do usuário
        finalInstructions = `Contexto do Agente "${activeAgent.name}": ${activeAgent.personalityStyle}.\nPrompt Base do Agente (Use como guia e contexto principal):\n${activeAgent.basePrompt}\n\nInstruções Específicas do Usuário para esta Geração:\n${data.userSpecificQuery || ''}`;
    }
    
    if (additionalInstructions) { // Para refinamento
        finalInstructions += `\n\nInstruções de Refinamento Adicionais: ${additionalInstructions}`;
    }

    // Preparar os dados para a API
    const apiInput = {
      clientId: selectedClient?.id,
      instructions: finalInstructions,
      contentType: data.contentType,
      socialPlatform: data.contentType === CreativeContentTypes.SOCIAL_MEDIA_POST.value ? data.socialPlatform : undefined,
      toneOfVoice: data.toneOfVoice,
      contentLength: mapSliderToContentLengthType(data.contentLengthValue),
      specificDataToInclude: data.specificDataToInclude,
      contentFormat: data.contentFormat,
      language: data.language,
      clientContextConfig: data.clientContextConfig,
      agentId: activeAgent?.id
    };

    try {
      // Chamar a API em vez do Firebase
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar conteúdo');
      }

      const result = await response.json();
      setGeneratedContent(result.creativeContent);
      setGeneratedSuggestions(result.suggestions || null);
      
      toast({
        title: additionalInstructions ? "Conteúdo Refinado!" : "Conteúdo Gerado!",
        description: `Seu conteúdo foi ${additionalInstructions ? 'refinado' : 'gerado'} pela IA.`,
        variant: "default",
      });

      // Manter a funcionalidade de histórico no localStorage até que seja completamente migrada
      const storedGeneratedContents = localStorage.getItem('artiaGeneratedContents');
      let history: GeneratedContentItem[] = storedGeneratedContents ? JSON.parse(storedGeneratedContents) : [];
      
      const newItem: GeneratedContentItem = {
        id: `gencontent-${Date.now()}`,
        originalInstructions: activeAgent ? `${activeAgent.basePrompt}\n\nESPECÍFICO: ${data.userSpecificQuery}` : data.instructions, // Salva a combinação se agente usado
        contentType: data.contentType,
        toneOfVoice: data.toneOfVoice,
        contentLengthValue: data.contentLengthValue,
        socialPlatform: data.contentType === CreativeContentTypes.SOCIAL_MEDIA_POST.value ? data.socialPlatform : undefined,
        specificDataToInclude: data.specificDataToInclude,
        contentFormat: data.contentFormat,
        language: data.language,
        clientContextConfig: data.clientContextConfig,
        clientName: selectedClient?.companyName,
        clientId: selectedClient?.id,
        createdAt: new Date().toISOString(),
        contentSnippet: result.creativeContent.substring(0, 150) + (result.creativeContent.length > 150 ? '...' : ''),
        fullContent: result.creativeContent,
        agentUsed: activeAgent ? { id: activeAgent.id, name: activeAgent.name } : undefined,
      };
      history.unshift(newItem);
      if (history.length > 50) history = history.slice(0, 50); 
      localStorage.setItem('artiaGeneratedContents', JSON.stringify(history));

    } catch (error: any) {
      console.error("Error generating AI content:", error);
      toast({
        title: "Erro na Geração",
        description: error.message || "Não foi possível gerar o conteúdo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsRefineDialogOpen(false);
      setRefineInstructions('');
    }
  }

  const handleRegenerate = () => {
    if (lastSubmittedData) {
      onSubmit(lastSubmittedData);
    } else {
      toast({ title: "Nada para regenerar", description: "Gere um conteúdo primeiro.", variant: "default" });
    }
  };
  
  const handleRefineSubmit = () => {
    if (lastSubmittedData && refineInstructions.trim()) {
      onSubmit(lastSubmittedData, refineInstructions);
    } else if (!refineInstructions.trim()) {
      toast({ title: "Instruções Vazias", description: "Por favor, forneça instruções para o refinamento.", variant: "destructive" });
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({ title: "Conteúdo Copiado!", description: "O conteúdo gerado foi copiado para a área de transferência." });
    }
  };
  
  const handleUseContentForTask = () => {
    if (generatedContent) {
      localStorage.setItem('artiaGeneratedContentForTask', generatedContent);
      let queryParams = '?fromAI=true';
      const currentClient = clients.find(c => c.id === getValues('clientId'));
      if (currentClient) { 
        queryParams += `&clientId=${currentClient.id}&clientName=${encodeURIComponent(currentClient.companyName)}`;
      }
      router.push(`/tasks/new${queryParams}`);
    } else {
      toast({ title: "Nenhum conteúdo para usar", description: "Gere um conteúdo primeiro.", variant: "default"});
    }
  };

  const handleOpenTaskIntegrationDialog = async (mode: 'comment' | 'attachment') => {
    if (!generatedContent) {
        toast({ title: "Nenhum conteúdo gerado", description: "Gere um conteúdo antes de integrar com uma tarefa.", variant: "default"});
        return;
    }
    
    if (!currentUser) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }
    
    setTaskIntegrationMode(mode);
    setIsLoadingTasks(true);
    
    try {
        // Chamar a API em vez do Firestore
        const response = await fetch('/api/tasks');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar tarefas: ${response.status}`);
        }
        
        const tasksData = await response.json();
        setAllTasks(tasksData);
        
        // Definir valor padrão se houver tarefas
        if (tasksData.length > 0) {
          taskIntegrationForm.setValue('taskId', tasksData[0].id);
          setSelectedTaskIdForIntegration(tasksData[0].id);
        }
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
        setAllTasks([]);
        toast({ title: "Erro ao carregar tarefas", variant: "destructive" });
    } finally {
        setIsLoadingTasks(false);
        setIsTaskIntegrationDialogOpen(true);
    }
  };

  const handleIntegrateWithTask = async () => {
    const { taskId } = taskIntegrationForm.getValues();
    
    if (!taskId || !taskIntegrationMode || !generatedContent || !currentUser) {
        toast({ title: "Erro", description: "Seleção de tarefa, modo ou conteúdo inválido, ou usuário não logado.", variant: "destructive"});
        return;
    }

    try {
        const targetTaskData = allTasks.find(t => t.id === taskId);
        
        if (!targetTaskData) {
             toast({ title: "Erro", description: "Tarefa selecionada não encontrada.", variant: "destructive"});
             return;
        }
        
        if (taskIntegrationMode === 'comment') {
            // Adicionar como comentário via API
            const response = await fetch(`/api/tasks/${taskId}/comments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: `Conteúdo gerado por IA:\n\n${generatedContent}`
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Erro ao adicionar comentário');
            }
            
            toast({ title: "Sucesso!", description: `Conteúdo adicionado como comentário à tarefa "${targetTaskData.title}".`});
        } else if (taskIntegrationMode === 'attachment') {
            // Adicionar como anexo via API
            const response = await fetch(`/api/tasks/${taskId}/attachments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `Conteúdo IA - ${new Date().toLocaleDateString('pt-BR')}.txt`,
                content: generatedContent,
                type: 'document',
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Erro ao adicionar anexo');
            }
            
            toast({ title: "Sucesso!", description: `Conteúdo anexado à tarefa "${targetTaskData.title}".`});
        }
    } catch (error: any) {
        console.error("Erro ao integrar com tarefa:", error);
        toast({ title: "Erro de Integração", description: error.message || "Não foi possível atualizar a tarefa.", variant: "destructive"});
    } finally {
        setIsTaskIntegrationDialogOpen(false);
        setSelectedTaskIdForIntegration(undefined);
        setTaskIntegrationMode(null);
        taskIntegrationForm.reset();
    }
  };

  const clientContextFields = [
    { id: 'useBrandProfile' as keyof ClientContextConfig, label: 'Perfil da Marca', icon: Palette, clientField: 'brandProfile' as keyof Client },
    { id: 'useTargetAudience' as keyof ClientContextConfig, label: 'Público-Alvo', icon: Users2, clientField: 'targetAudience' as keyof Client },
    { id: 'useKeywords' as keyof ClientContextConfig, label: 'Palavras-chave', icon: Hash, clientField: 'keywords' as keyof Client },
    { id: 'useContentHistory' as keyof ClientContextConfig, label: 'Histórico de Conteúdo', icon: History, clientField: 'contentHistory' as keyof Client },
    { id: 'useMarketingObjectives' as keyof ClientContextConfig, label: 'Objetivos de Marketing', icon: Target, clientField: 'marketingObjectives' as keyof Client },
    { id: 'useRestrictions' as keyof ClientContextConfig, label: 'Restrições/Diretrizes', icon: Lock, clientField: 'restrictions' as keyof Client },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-xl">
        <Form {...form}>
          <form onSubmit={handleFormSubmit(data => onSubmit(data))} className="space-y-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Wand2 className="mr-3 h-7 w-7 text-primary" />
                Gerador de Conteúdo com IA {activeAgent && <span className="text-base text-muted-foreground ml-2">(Usando Agente: {activeAgent.name})</span>}
              </CardTitle>
              <CardDescription>
                Forneça as instruções e o contexto para a IA criar seu conteúdo de marketing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Cliente (Opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === NO_CLIENT_VALUE ? '' : value)}
                      value={field.value || NO_CLIENT_VALUE}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingClients ? "Carregando clientes..." : "Selecione um cliente para dar contexto à IA"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_CLIENT_VALUE}>Nenhum cliente (contexto geral)</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id!}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Selecionar um cliente ajudará a IA a gerar conteúdo mais alinhado com a marca.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeAgent ? (
                <>
                  <Card className="bg-muted/50 p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-md">Prompt Base do Agente: {activeAgent.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <FormDescription className="text-sm whitespace-pre-wrap">
                        {activeAgent.basePrompt}
                      </FormDescription>
                      <FormDescription className="text-xs mt-2">
                        Estilo: {activeAgent.personalityStyle}
                      </FormDescription>
                    </CardContent>
                  </Card>
                  <FormField
                    control={control}
                    name="userSpecificQuery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu Pedido Específico para o Agente</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Crie três opções de copy para um anúncio no Instagram sobre nosso novo tênis esportivo, focando no conforto e durabilidade."
                            rows={4}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <FormField
                  control={control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suas Instruções para IA</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Crie um post para Instagram sobre o lançamento do nosso novo produto X, destacando seus benefícios A, B e C. Use um tom divertido e inclua uma chamada para ação para visitar nosso site."
                          rows={5}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conteúdo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CreativeContentTypes).map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedContentType === CreativeContentTypes.SOCIAL_MEDIA_POST.value && (
                   <FormField
                    control={control}
                    name="socialPlatform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || SocialPlatforms.INSTAGRAM.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione a plataforma" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SocialPlatforms).map((platform) => (
                              <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={control}
                  name="toneOfVoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tom de Voz</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o tom" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.values(TonesOfVoice).map((tone) => (
                            <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="contentFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-muted-foreground"/>Formato Específico</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.values(ContentFormats).map((format) => (
                            <SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><LanguagesIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Idioma</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o idioma" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.values(Languages).map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="contentLengthValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extensão Desejada: <span className="text-primary font-semibold">{ContentLengths[Object.keys(ContentLengths).find(key => ContentLengths[key as keyof typeof ContentLengths].value === mapSliderToContentLengthType(field.value)) as keyof typeof ContentLengths]?.label.split('(')[0].trim()}</span></FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        onValueChange={(value) => field.onChange(value[0])}
                        value={[field.value]}
                      />
                    </FormControl>
                    <FormDescription>{ContentLengths[Object.keys(ContentLengths).find(key => ContentLengths[key as keyof typeof ContentLengths].value === mapSliderToContentLengthType(field.value)) as keyof typeof ContentLengths]?.label}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="specificDataToInclude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Type className="mr-2 h-4 w-4 text-muted-foreground"/>Dados Específicos para Incluir (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Estatísticas, citações, detalhes de produtos" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Liste dados que a IA deve tentar incorporar no texto.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" className="w-full md:w-auto" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Gerar Conteúdo
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <div className="lg:col-span-1 space-y-6">
        {selectedClient && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Contexto do Cliente: {selectedClient.companyName}</CardTitle>
              <CardDescription>Selecione as informações do cliente para usar como contexto para a IA.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-4">
                    {clientContextFields.map(contextField => (
                    <FormField
                        key={contextField.id}
                        control={form.control}
                        name={`clientContextConfig.${contextField.id}`}
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!selectedClient || !selectedClient[contextField.clientField]}
                            />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center text-sm">
                                <contextField.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {contextField.label}
                            </FormLabel>
                            {selectedClient && selectedClient[contextField.clientField] ? (
                                <FormDescription className="text-xs line-clamp-2">
                                    {selectedClient[contextField.clientField]}
                                </FormDescription>
                            ) : (
                                <FormDescription className="text-xs text-destructive/70">
                                    Não preenchido para este cliente.
                                </FormDescription>
                            )}
                            </div>
                        </FormItem>
                        )}
                    />
                    ))}
                </div>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Contexto selecionado para IA:</p>
                    <ul className="list-disc list-inside text-muted-foreground text-xs">
                        {clientContextFields.filter(cf => form.watch(`clientContextConfig.${cf.id}`) && selectedClient && selectedClient[cf.clientField]).map(cf => (
                            <li key={`summary-${cf.id}`}>{cf.label}</li>
                        ))}
                        {(!selectedClient || clientContextFields.filter(cf => form.watch(`clientContextConfig.${cf.id}`) && selectedClient && selectedClient[cf.clientField]).length === 0) && (
                            <li>Nenhum contexto específico do cliente será usado.</li>
                        )}
                    </ul>
                </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              Conteúdo Gerado
            </CardTitle>
            <CardDescription>Aqui aparecerá o resultado da IA.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Gerando conteúdo...</p>
              </div>
            )}
            {generatedContent && !isGenerating && (
              <div className="space-y-4">
                <ScrollArea className="h-64">
                  <Textarea
                    readOnly
                    value={generatedContent}
                    rows={10}
                    className="bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </ScrollArea>
                {generatedSuggestions && generatedSuggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Sugestões da IA:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {generatedSuggestions.map((sug, index) => <li key={index}>{sug}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!generatedContent && !isGenerating && (
              <div className="text-center text-muted-foreground py-10">
                O conteúdo gerado pela IA será exibido aqui.
              </div>
            )}
          </CardContent>
          {generatedContent && !isGenerating && (
            <CardFooter className="flex-col items-stretch gap-2 border-t pt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyToClipboard} className="flex-1">
                  <Copy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                <Button variant="outline" onClick={handleRegenerate} className="flex-1" disabled={isGenerating}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Regenerar
                </Button>
              </div>
              <Separator className="my-2"/>
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={isRefineDialogOpen} onOpenChange={setIsRefineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Pencil className="mr-2 h-3.5 w-3.5"/>Refinar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Refinar Conteúdo</DialogTitle>
                       <DialogDescriptionContent>
                         Adicione instruções específicas para a IA refinar o conteúdo gerado anteriormente.
                       </DialogDescriptionContent>
                    </DialogHeader>
                    <Textarea 
                      placeholder="Ex: Torne o tom mais formal, adicione um parágrafo sobre X, remova a menção a Y..."
                      value={refineInstructions}
                      onChange={(e) => setRefineInstructions(e.target.value)}
                      rows={4}
                      className="my-4"
                    />
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                      <Button onClick={handleRefineSubmit} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                        Refinar Agora
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" disabled><Maximize className="mr-2 h-3.5 w-3.5"/>Expandir</Button>
                <Button variant="outline" size="sm" disabled><Minimize className="mr-2 h-3.5 w-3.5"/>Encurtar</Button>
                <Button variant="outline" size="sm" disabled><LanguagesIcon className="mr-2 h-3.5 w-3.5"/>Traduzir</Button>
              </div>
               <Separator className="my-2"/>
                <Button variant="default" className="w-full" onClick={handleUseContentForTask}>
                    <Send className="mr-2 h-4 w-4" /> Usar para Nova Tarefa
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" className="w-full" onClick={() => handleOpenTaskIntegrationDialog('comment')}>
                        <MessageSquarePlus className="mr-2 h-4 w-4" /> Comentar em Tarefa
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleOpenTaskIntegrationDialog('attachment')}>
                        <Paperclip className="mr-2 h-4 w-4" /> Anexar à Tarefa
                    </Button>
                </div>
            </CardFooter>
          )}
        </Card>
      </div>

      <Dialog open={isTaskIntegrationDialogOpen} onOpenChange={setIsTaskIntegrationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {taskIntegrationMode === 'comment' ? 'Adicionar Conteúdo como Comentário' : 'Anexar Conteúdo à Tarefa'}
            </DialogTitle>
            <DialogDescriptionContent>
              Selecione a tarefa à qual deseja {taskIntegrationMode === 'comment' ? 'adicionar este conteúdo como um comentário.' : 'anexar este conteúdo (simulado).'}
            </DialogDescriptionContent>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Form {...taskIntegrationForm}>
              <form onSubmit={taskIntegrationForm.handleSubmit(handleIntegrateWithTask)}>
                <FormField 
                  control={taskIntegrationForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Tarefa</FormLabel>
                      {isLoadingTasks ? (
                        <div className="flex items-center text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Carregando tarefas...
                        </div>
                      ) : allTasks.length > 0 ? (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTaskIdForIntegration(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha uma tarefa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-[200px]">
                              {allTasks.map(task => (
                                <SelectItem key={task.id} value={task.id!}>
                                  {task.title}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada para o usuário atual.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            {selectedTaskIdForIntegration && taskIntegrationMode === 'attachment' && (
              <p className="text-xs text-muted-foreground">
                Nota: Isso simulará um anexo de arquivo de texto com o conteúdo gerado.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => {
                setSelectedTaskIdForIntegration(undefined);
                setTaskIntegrationMode(null);
                taskIntegrationForm.reset();
              }}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={handleIntegrateWithTask} 
              disabled={!selectedTaskIdForIntegration || allTasks.length === 0 || isLoadingTasks}
            >
              {taskIntegrationMode === 'comment' ? 'Adicionar Comentário' : 'Anexar Conteúdo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
