
'use client';

import Link from 'next/link'; // Importar Link do Next.js
import type { Task, User } from '@/types';
// useRouter não é mais necessário aqui se o Link funcionar
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PRIORITIES, TASK_TYPES_MARKETING } from '@/lib/constants';
import { CalendarDays, MessageSquare, Paperclip, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean; // Indica se este card está sendo renderizado no DragOverlay
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlySortableDragging,
  } = useSortable({ 
    id: task.id,
    disabled: isDragging, 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlySortableDragging || isDragging ? 0.7 : 1,
  };

  const priorityInfo = PRIORITIES.find(p => p.value === task.priority);
  const taskTypeInfo = TASK_TYPES_MARKETING.find(t => t.value === task.type);
  const Icon = taskTypeInfo?.icon;

  const cardInnerContent = (
    // O Card é apenas para o visual, não é mais o elemento principal para interações de arrastar ou navegação
    <Card
      className={cn(
        "shadow-md transition-shadow duration-200 bg-card w-full rounded-lg outline-none",
        // Estilos de foco e cursor serão aplicados ao Link
      )}
    >
      <CardHeader className="p-4">
        {priorityInfo && (
          <div className={`h-2 w-full rounded-t-md ${priorityInfo.colorClass} mb-2 -mx-4 -mt-4`}></div>
        )}
        <CardTitle className="text-base font-semibold leading-tight text-card-foreground pt-2">
          {task.title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-1" />}
        <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description || 'Sem descrição'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs">
        <div className="flex items-center text-muted-foreground mb-2">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
          <span>{format(parseISO(task.dueDate), "dd MMM, yyyy", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center space-x-1">
          {task.assignees.slice(0, 3).map((assignee: User) => (
            <Avatar key={assignee.id} className="h-6 w-6 border-2 border-card" title={assignee.name}>
              <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="person avatar" />
              <AvatarFallback>{assignee.name.substring(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
          {task.assignees.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{task.assignees.length - 3}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.comments && task.comments.length > 0 && ( <div className="flex items-center"> <MessageSquare className="h-3.5 w-3.5 mr-1" /> {task.comments.length} </div> )}
          {task.attachments && task.attachments.length > 0 && ( <div className="flex items-center"> <Paperclip className="h-3.5 w-3.5 mr-1" /> {task.attachments.length} </div> )}
          {task.subtasks && task.subtasks.length > 0 && ( <div className="flex items-center"> <CheckSquare className="h-3.5 w-3.5 mr-1" /> {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} </div> )}
        </div>
        {priorityInfo && <Badge variant="outline" className={`capitalize border-${priorityInfo.colorClass.replace('bg-','')} text-${priorityInfo.colorClass.replace('bg-','')}`}>{priorityInfo.label}</Badge>}
      </CardFooter>
    </Card>
  );

  if (isDragging) {
    // Card no DragOverlay: apenas visual, o container no DragOverlay definirá a largura
    // O estilo de `transform` e `transition` vem de `useSortable` via `style` prop.
    // `zIndex` e `cursor` são aplicados ao container no DragOverlay ou via `DragOverlay` props.
    return (
        <div style={style}> {/* Este div é o que dnd-kit move no overlay */}
            {cardInnerContent}
        </div>
    );
  }

  // Card normal na coluna: Link é o elemento arrastável e clicável
  return (
    <Link
      href={`/tasks/${task.id}`}
      ref={setNodeRef} // dnd-kit usa este ref para identificar o nó
      style={style} // dnd-kit usa este style para aplicar transformações
      {...attributes} // Props de acessibilidade e outros do dnd-kit
      {...listeners}  // Handlers de mouse/touch para iniciar o arrasto
      className={cn(
        "block mb-4 outline-none rounded-lg", // `block` para ocupar espaço, `mb-4` para espaçamento
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Estilo de foco
        (isCurrentlySortableDragging) 
          ? "cursor-grabbing shadow-2xl ring-2 ring-primary" 
          : "cursor-grab hover:shadow-xl",
      )}
      aria-label={`Tarefa: ${task.title}. Clique para ver detalhes ou arraste para mover.`}
      tabIndex={0} // Torna o Link focável pelo teclado
    >
      {cardInnerContent}
    </Link>
  );
}
