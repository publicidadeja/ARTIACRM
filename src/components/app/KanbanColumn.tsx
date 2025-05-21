
'use client';

import type { KanbanColumn as KanbanColumnType } from '@/types';
import { TaskCard } from './TaskCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { PlusCircle, Trash2 } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onDeleteCustomColumn?: () => void; 
  onClearColumnTasks?: () => void; // New prop for clearing tasks
}

export function KanbanColumn({ column, onDeleteCustomColumn, onClearColumnTasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks.map(task => task.id);

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-80 min-w-80 md:w-96 md:min-w-96 bg-muted/50 rounded-lg shadow-sm overflow-hidden h-full"
    >
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          {column.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
            {column.tasks.length}
          </span>
          {onClearColumnTasks && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearColumnTasks}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label={`Limpar tarefas da coluna ${column.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {column.isCustom && onDeleteCustomColumn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteCustomColumn}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label={`Excluir coluna ${column.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.length > 0 ? (
            column.tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma tarefa nesta coluna.
            </div>
          )}
        </SortableContext>
      </ScrollArea>
      <div className="p-2 border-t border-border">
         <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary" asChild>
           <Link href={{ pathname: "/tasks/new", query: { defaultStatus: column.id } }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Tarefa
           </Link>
         </Button>
      </div>
    </div>
  );
}
