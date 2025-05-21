
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { INITIAL_TASKS, TEAM_MEMBERS as FALLBACK_TEAM_MEMBERS, PRIORITIES, TASK_TYPES_MARKETING, INITIAL_CLIENTS } from '@/lib/constants';
import type { Task, User, Subtask, Attachment, Comment, Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarDays, 
  Tag, 
  UserCircle, 
  Paperclip, 
  MessageSquare, 
  ListChecks, 
  Edit3,
  PlusCircle,
  FileText,
  ImageIcon,
  VideoIcon,
  FileQuestion,
  Target,
  Mailbox,
  BarChart3,
  Tv,
  Users2,
  Settings2,
  Link2,
  Send,
  Briefcase
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';


function getAttachmentIcon(type: Attachment['type']) {
  switch (type) {
    case 'image': return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
    case 'video': return <VideoIcon className="h-5 w-5 text-muted-foreground" />;
    case 'document': return <FileText className="h-5 w-5 text-muted-foreground" />;
    default: return <FileQuestion className="h-5 w-5 text-muted-foreground" />;
  }
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  const [isAddSubtaskDialogOpen, setIsAddSubtaskDialogOpen] = useState(false);
  const [isAddCommentDialogOpen, setIsAddCommentDialogOpen] = useState(false);
  const [isAddAttachmentDialogOpen, setIsAddAttachmentDialogOpen] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  useEffect(() => {
    const tasksFromStorage = localStorage.getItem('kanbanTasks');
    let currentTasks = INITIAL_TASKS; // Fallback to empty if no tasks in storage initially
    if (tasksFromStorage) {
      try {
        currentTasks = JSON.parse(tasksFromStorage);
      } catch (e) {
        console.error("Error parsing tasks from localStorage for task detail:", e);
      }
    }
    const foundTask = currentTasks.find(t => t.id === taskId);
    
    if (foundTask) {
      setTask(JSON.parse(JSON.stringify(foundTask))); // Deep copy
    }

    const storedUsers = localStorage.getItem('artiaUsers');
    if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        if (users.length > 0) {
            setCurrentUser(users[0]); // Use the first registered user as the current user for comments
        }
    }
    if (!currentUser && FALLBACK_TEAM_MEMBERS.length > 0) {
        setCurrentUser(FALLBACK_TEAM_MEMBERS[0]); // Fallback if no users in localStorage
    }

  }, [taskId, currentUser]); // Removed currentUser from dependency to avoid loop if it's set inside

  if (!task) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl mb-6">Tarefa não encontrada</h1>
        <p>A tarefa que você está procurando não existe ou foi movida.</p>
        <Button asChild className="mt-4">
          <Link href="/board">Voltar ao Quadro Kanban</Link>
        </Button>
      </div>
    );
  }

  const priorityInfo = PRIORITIES.find(p => p.value === task.priority);
  const taskTypeInfo = TASK_TYPES_MARKETING.find(t => t.value === task.type);
  const TypeIcon = taskTypeInfo?.icon;

  const handleEdit = () => {
    router.push(`/tasks/${task.id}/edit`);
  };

  const updateTasksInLocalStorage = (updatedTask: Task) => {
    const tasksFromStorage = localStorage.getItem('kanbanTasks');
    let currentTasks: Task[] = tasksFromStorage ? JSON.parse(tasksFromStorage) : [];
    const taskIndex = currentTasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex > -1) {
      currentTasks[taskIndex] = updatedTask;
    } else {
      currentTasks.unshift(updatedTask); // Should not happen in edit context, but as a fallback
    }
    localStorage.setItem('kanbanTasks', JSON.stringify(currentTasks));
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setTask(prevTask => {
      if (!prevTask) return null;
      const updatedSubtasks = (prevTask.subtasks || []).map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      const updatedTask = { ...prevTask, subtasks: updatedSubtasks };
      updateTasksInLocalStorage(updatedTask);
      return updatedTask;
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) {
      toast({ title: "Texto da subtarefa é obrigatório", variant: "destructive" });
      return;
    }
    setTask(prevTask => {
      if (!prevTask) return null;
      const newSub: Subtask = {
        id: `subtask-${prevTask.id}-${Date.now()}`,
        text: newSubtaskText,
        completed: false,
      };
      const updatedSubtasks = [...(prevTask.subtasks || []), newSub];
      const updatedTask = { ...prevTask, subtasks: updatedSubtasks };
      updateTasksInLocalStorage(updatedTask);
      setNewSubtaskText('');
      setIsAddSubtaskDialogOpen(false);
      toast({ title: "Subtarefa adicionada!" });
      return updatedTask;
    });
  };
  
  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({ title: "Comentário não pode estar vazio", variant: "destructive" });
      return;
    }
    
    const author = currentUser || { 
        id: 'user-system', 
        name: 'Usuário do Sistema', 
        avatarUrl: 'https://placehold.co/100x100/E0F7FA/1C4A5C?text=UA',
        email: 'system@artia.com',
        role: 'membro'
    };

    setTask(prevTask => {
      if (!prevTask) return null;
      const newComm: Comment = {
        id: `comment-${prevTask.id}-${Date.now()}`,
        userId: author.id, 
        userName: author.name, 
        userAvatarUrl: author.avatarUrl,
        text: newComment,
        createdAt: new Date().toISOString(),
      };
      const updatedComments = [...(prevTask.comments || []), newComm];
      const updatedTask = { ...prevTask, comments: updatedComments };
      updateTasksInLocalStorage(updatedTask);
      setNewComment('');
      setIsAddCommentDialogOpen(false);
      toast({ title: "Comentário adicionado!" });
      return updatedTask;
    });
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) {
      toast({ title: "Nome do anexo é obrigatório", variant: "destructive" });
      return;
    }
    setTask(prevTask => {
      if (!prevTask) return null;
      const newAtt: Attachment = {
        id: `att-${prevTask.id}-${Date.now()}`,
        name: newAttachmentName,
        url: '#', 
        type: 'other', 
        size: 'N/A (simulado)', 
      };
      const updatedAttachments = [...(prevTask.attachments || []), newAtt];
      const updatedTask = { ...prevTask, attachments: updatedAttachments };
      updateTasksInLocalStorage(updatedTask);
      setNewAttachmentName('');
      setIsAddAttachmentDialogOpen(false);
      toast({ title: "Anexo (simulado) adicionado!" });
      return updatedTask;
    });
  };


  return (
    <div className="container mx-auto py-2">
       <div className="flex items-center justify-end mb-6">
          <Button variant="outline" onClick={handleEdit}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar Tarefa
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">Descrição</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              
              {task.references && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-1 text-foreground flex items-center"><Link2 className="mr-2 h-4 w-4 text-primary" />Referências</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.references}</p>
                  </div>
                </>
              )}

              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {task.clientName && (
                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-1 text-foreground flex items-center"><Briefcase className="mr-2 h-4 w-4 text-primary" />Cliente</h4>
                    <p className="text-muted-foreground">{task.clientName}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-1 text-foreground flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Tipo</h4>
                  <div className="flex items-center">
                    {TypeIcon && <TypeIcon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span className="text-muted-foreground">{task.type}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-foreground">Prioridade</h4>
                  {priorityInfo && (
                    <Badge variant="outline" className={`border-${priorityInfo.colorClass.replace('bg-','')} text-${priorityInfo.colorClass.replace('bg-','')} capitalize`}>
                      <span className={`mr-2 h-2 w-2 rounded-full ${priorityInfo.colorClass}`} />
                      {priorityInfo.label}
                    </Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Prazo</h4>
                  <p className="text-muted-foreground">{format(parseISO(task.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                 <div>
                  <h4 className="font-semibold mb-1 text-foreground flex items-center"><Settings2 className="mr-2 h-4 w-4 text-primary" />Status</h4>
                  <Badge variant="secondary" className="capitalize">{task.status.replace(/_/g, ' ')}</Badge>
                </div>
              </div>

              {(task.platform || task.format || task.subject || task.segment || task.expectedMetrics) && <Separator/>}
              
              {task.type === 'Posts para redes sociais' && (
                <div className="space-y-2 mt-3 text-sm">
                  {task.platform && <p className="flex items-center"><Tv className="mr-2 h-4 w-4 text-muted-foreground" /><strong className="text-foreground">Plataforma:</strong> <span className="ml-1 text-muted-foreground">{task.platform}</span></p>}
                  {task.format && <p className="flex items-center"><Users2 className="mr-2 h-4 w-4 text-muted-foreground" /><strong className="text-foreground">Formato:</strong> <span className="ml-1 text-muted-foreground">{task.format}</span></p>}
                </div>
              )}

              {task.type === 'Campanhas de email marketing' && (
                <div className="space-y-2 mt-3 text-sm">
                  {task.subject && <p className="flex items-center"><Mailbox className="mr-2 h-4 w-4 text-muted-foreground" /><strong className="text-foreground">Assunto do Email:</strong> <span className="ml-1 text-muted-foreground">{task.subject}</span></p>}
                  {task.segment && <p className="flex items-center"><Target className="mr-2 h-4 w-4 text-muted-foreground" /><strong className="text-foreground">Segmento:</strong> <span className="ml-1 text-muted-foreground">{task.segment}</span></p>}
                  {task.expectedMetrics && <p className="flex items-center"><BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" /><strong className="text-foreground">Métricas Esperadas:</strong> <span className="ml-1 text-muted-foreground">{task.expectedMetrics}</span></p>}
                </div>
              )}

            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Checklist (Subtarefas)</CardTitle>
            </CardHeader>
            <CardContent>
              {(task.subtasks && task.subtasks.length > 0) ? (
                <ul className="space-y-3">
                  {task.subtasks.map((subtask: Subtask) => (
                    <li key={subtask.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={`subtask-${subtask.id}`} 
                        checked={subtask.completed} 
                        onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        aria-labelledby={`subtask-label-${subtask.id}`}
                      />
                      <label htmlFor={`subtask-${subtask.id}`} id={`subtask-label-${subtask.id}`} className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {subtask.text}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma subtarefa adicionada.</p>
              )}
            </CardContent>
            <CardFooter>
              <Dialog open={isAddSubtaskDialogOpen} onOpenChange={setIsAddSubtaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Subtarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Nova Subtarefa</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Input 
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      placeholder="Descrição da subtarefa"
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddSubtask}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary" />Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {task.assignees.map((assignee: User) => (
                  <li key={assignee.id} className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="person avatar" />
                      <AvatarFallback>{assignee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{assignee.name}</p>
                      <p className="text-xs text-muted-foreground">{assignee.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Paperclip className="mr-2 h-5 w-5 text-primary" />Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              {(task.attachments && task.attachments.length > 0) ? (
                <ul className="space-y-3">
                  {task.attachments.map((attachment: Attachment) => (
                    <li key={attachment.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md">
                      {getAttachmentIcon(attachment.type)}
                      <div>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                          {attachment.name}
                        </a>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-muted-foreground">Nenhum anexo adicionado.</p>
              )}
            </CardContent>
            <CardFooter>
               <Dialog open={isAddAttachmentDialogOpen} onOpenChange={setIsAddAttachmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Anexo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Novo Anexo (Simulado)</DialogTitle></DialogHeader>
                  <div className="py-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Em uma aplicação real, aqui haveria um campo de upload.</p>
                    <Input 
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      placeholder="Nome do arquivo (ex: imagem.png)"
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddAttachment}>Adicionar Anexo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary" />Comentários</CardTitle>
            </CardHeader>
            <CardContent>
              {(task.comments && task.comments.length > 0) ? (
                <ScrollArea className="h-60 pr-3"> 
                  <ul className="space-y-4">
                    {task.comments.map((comment: Comment) => (
                      <li key={comment.id} className="flex items-start space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={comment.userAvatarUrl || FALLBACK_TEAM_MEMBERS.find(m => m.id === comment.userId)?.avatarUrl || "https://placehold.co/100x100"} alt={comment.userName} data-ai-hint="person avatar"/>
                          <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <p className="text-sm font-medium text-foreground">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(comment.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
              )}
            </CardContent>
            <CardFooter>
              <Dialog open={isAddCommentDialogOpen} onOpenChange={setIsAddCommentDialogOpen}>
                <DialogTrigger asChild>
                   <Button variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Comentário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Novo Comentário</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva seu comentário..."
                      rows={4}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddComment}><Send className="mr-2 h-4 w-4"/>Enviar Comentário</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

