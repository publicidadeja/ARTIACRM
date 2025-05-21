
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { KanbanColumn } from '@/components/app/KanbanColumn';
import { KANBAN_COLUMNS_LIST, PRIORITIES, INITIAL_TASKS } from '@/lib/constants';
import type { TaskStatus, Priority as PriorityType, Task, KanbanColumn as KanbanColumnType } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, ListFilter, Trash2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { TaskCard } from '@/components/app/TaskCard';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

type PredefinedColumnVisibilityState = Record<string, boolean>; // Key is TaskStatus (string)
type PriorityFiltersState = Record<PriorityType, boolean>;
type UserDefinedColumn = { id: string; title: string; isCustom?: boolean };

export default function BoardPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [predefinedColumnVisibility, setPredefinedColumnVisibility] = useState<PredefinedColumnVisibilityState>(() => {
    const initialFilters = {} as PredefinedColumnVisibilityState;
    KANBAN_COLUMNS_LIST.forEach(col => {
      initialFilters[col.id] = true;
    });
    return initialFilters;
  });

  const [userDefinedColumns, setUserDefinedColumns] = useState<UserDefinedColumn[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<PriorityFiltersState>(() => {
    const initialFilters = {} as PriorityFiltersState;
    PRIORITIES.forEach(p => {
      initialFilters[p.value] = true;
    });
    return initialFilters;
  });

  const [isManageColumnsDialogOpen, setIsManageColumnsDialogOpen] = useState(false);
  const [newCustomColumnTitle, setNewCustomColumnTitle] = useState('');

  // Load states from localStorage
  useEffect(() => {
    const storedTasks = localStorage.getItem('kanbanTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      setTasks(INITIAL_TASKS); // Fallback to initial tasks if nothing in localStorage
    }

    const storedVisibility = localStorage.getItem('predefinedColumnVisibility');
    if (storedVisibility) {
      setPredefinedColumnVisibility(JSON.parse(storedVisibility));
    } else {
      const initialVisibility = {} as PredefinedColumnVisibilityState;
      KANBAN_COLUMNS_LIST.forEach(col => initialVisibility[col.id] = true);
      setPredefinedColumnVisibility(initialVisibility);
    }

    const storedUserColumns = localStorage.getItem('userDefinedColumns');
    if (storedUserColumns) {
      setUserDefinedColumns(JSON.parse(storedUserColumns));
    }

    const storedPriorityFilters = localStorage.getItem('priorityFilters');
    if (storedPriorityFilters) {
      setPriorityFilters(JSON.parse(storedPriorityFilters));
    }
  }, []);

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('predefinedColumnVisibility', JSON.stringify(predefinedColumnVisibility));
  }, [predefinedColumnVisibility]);

  useEffect(() => {
    localStorage.setItem('userDefinedColumns', JSON.stringify(userDefinedColumns));
  }, [userDefinedColumns]);

  useEffect(() => {
    localStorage.setItem('priorityFilters', JSON.stringify(priorityFilters));
  }, [priorityFilters]);


  const handlePredefinedColumnVisibilityChange = (columnId: string, checked: boolean) => {
    setPredefinedColumnVisibility(prevFilters => ({
      ...prevFilters,
      [columnId]: checked,
    }));
  };

  const handlePriorityFilterChange = (priorityValue: PriorityType, checked: boolean) => {
    setPriorityFilters(prevFilters => ({
      ...prevFilters,
      [priorityValue]: checked,
    }));
  };
  
  const handleAddCustomColumn = () => {
    if (!newCustomColumnTitle.trim()) {
      toast({ title: "Título Inválido", description: "Por favor, insira um título para a nova coluna.", variant: "destructive" });
      return;
    }
    const newId = `custom_${newCustomColumnTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    setUserDefinedColumns(prev => [...prev, { id: newId, title: newCustomColumnTitle, isCustom: true }]);
    setNewCustomColumnTitle('');
    toast({ title: "Coluna Adicionada", description: `A coluna "${newCustomColumnTitle}" foi criada.` });
  };

  const handleDeleteUserDefinedColumn = (columnIdToDelete: string) => {
    const tasksInColumn = tasks.filter(task => task.status === columnIdToDelete);
    if (tasksInColumn.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Mova ou reatribua as tarefas desta coluna antes de excluí-la.",
        variant: "destructive",
      });
      return;
    }
    setUserDefinedColumns(prev => prev.filter(col => col.id !== columnIdToDelete));
    toast({ title: "Coluna Excluída", description: "A coluna personalizada foi removida." });
  };

  const handleClearCompletedTasks = () => {
    setTasks(prevTasks => prevTasks.filter(task => task.status !== 'concluido'));
    toast({
      title: "Tarefas Removidas",
      description: "Todas as tarefas da coluna 'Concluído' foram removidas.",
    });
  };


  const allDisplayableColumns = useMemo(() => {
    const activePredefined = KANBAN_COLUMNS_LIST
      .filter(col => predefinedColumnVisibility[col.id] !== false)
      .map(col => ({ ...col, isCustom: false }));
    return [...activePredefined, ...userDefinedColumns];
  }, [predefinedColumnVisibility, userDefinedColumns]);


  const filteredTasksByPriority = tasks.filter(task => {
    const priorityMatch = priorityFilters[task.priority];
    return priorityMatch !== false; 
  });
  
  const kanbanData: KanbanColumnType[] = allDisplayableColumns.map(column => ({
    ...column,
    tasks: filteredTasksByPriority.filter(task => task.status === column.id),
  }));
  
  const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250, // milliseconds
        tolerance: 5, // pixels
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeTask || active.id === over.id) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const currentActiveTask = tasks.find(t => t.id === activeId);
    if (!currentActiveTask) return;
  
    // Check if dragging over a column
    const overIsColumn = allDisplayableColumns.some(col => col.id === overId);
    if (overIsColumn) {
      if (currentActiveTask.status !== overId) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId ? { ...task, status: overId as TaskStatus } : task
          )
        );
      }
      return; 
    }
  
    // Check if dragging over another task
    const overIsTask = tasks.some(t => t.id === overId);
    if (overIsTask) {
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask && currentActiveTask.status !== targetTask.status) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId ? { ...task, status: targetTask.status } : task
          )
        );
      }
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null); 
  
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeTaskExists = tasks.find(t => t.id === activeId);
    if (!activeTaskExists) return;

    setTasks((currentTasks) => {
        const oldIndex = currentTasks.findIndex((task) => task.id === activeId);
        let newIndex = currentTasks.findIndex((task) => task.id === overId);

        // If dragging over a column (and not a task within it directly for reordering)
        // or if overId is not a task, we keep the task in its current relative order 
        // within its new column (status updated by onDragOver).
        // If overId IS a task, arrayMove handles reordering.
        const overIsTask = currentTasks.some(t => t.id === overId);

        if (oldIndex === -1) return currentTasks; // Should not happen if activeTaskExists

        if (overIsTask) {
             // If the task is dropped on another task, move it relative to that task
            if (currentTasks[oldIndex].status === currentTasks[newIndex].status) {
                return arrayMove(currentTasks, oldIndex, newIndex);
            } else {
                // Task is changing column AND being dropped on specific task
                // The status is already updated by onDragOver.
                // We need to find the correct index in the overall list for reordering.
                return arrayMove(currentTasks, oldIndex, newIndex);
            }
        } else {
             // If dropped on a column directly, status is updated by onDragOver.
             // No specific re-ordering based on another task's index is needed here,
             // its relative order among all tasks is maintained.
             return currentTasks;
        }
    });
  };

  const activePriorityFiltersCount = PRIORITIES.filter(p => priorityFilters[p.value]).length;
  const allPrioritiesSelected = activePriorityFiltersCount === PRIORITIES.length || activePriorityFiltersCount === 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Quadro Kanban</h1>
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" /> Colunas Predefinidas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Mostrar Colunas Predefinidas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {KANBAN_COLUMNS_LIST.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={predefinedColumnVisibility[col.id] !== false}
                    onCheckedChange={(checked) => handlePredefinedColumnVisibilityChange(col.id, Boolean(checked))}
                  >
                    {col.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" /> Prioridades
                  {!allPrioritiesSelected && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                      {activePriorityFiltersCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Mostrar Prioridades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {PRIORITIES.map(p => (
                  <DropdownMenuCheckboxItem
                    key={p.value}
                    checked={priorityFilters[p.value] !== false}
                    onCheckedChange={(checked) => handlePriorityFilterChange(p.value, Boolean(checked))}
                  >
                    <div className="flex items-center">
                      <span className={`mr-2 h-2 w-2 rounded-full ${p.colorClass}`} />
                      {p.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" onClick={() => setIsManageColumnsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Gerenciar Colunas
            </Button>

            <Button asChild>
              <Link href="/tasks/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa
              </Link>
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-grow pb-4">
          <SortableContext items={taskIds} strategy={() => null}> 
            <div className="flex gap-6 h-full">
                  {kanbanData.map(column => (
                    <KanbanColumn 
                      key={column.id} 
                      column={column} 
                      onDeleteCustomColumn={column.isCustom ? () => handleDeleteUserDefinedColumn(column.id) : undefined}
                      onClearColumnTasks={column.id === 'concluido' ? handleClearCompletedTasks : undefined}
                    />
                  ))}
              {kanbanData.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Nenhuma coluna para exibir com os filtros atuais.
                </div>
              )}
            </div>
          </SortableContext>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <DragOverlay>
          {activeTask ? (
            <div className="w-80 md:w-96">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </div>

      <Dialog open={isManageColumnsDialogOpen} onOpenChange={setIsManageColumnsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Colunas Personalizadas</DialogTitle>
            <DialogDescription>
              Adicione novas colunas ou remova as personalizadas existentes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">Colunas Personalizadas Atuais</h4>
              {userDefinedColumns.length > 0 ? (
                <ScrollArea className="h-40 rounded-md border p-2">
                  <ul className="space-y-2">
                    {userDefinedColumns.map(col => (
                      <li key={col.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="text-sm text-foreground">{col.title}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteUserDefinedColumn(col.id)}
                          aria-label={`Excluir coluna ${col.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma coluna personalizada criada.</p>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">Adicionar Nova Coluna</h4>
              <div className="flex items-center gap-2">
                <Input
                  id="new-custom-column-title"
                  value={newCustomColumnTitle}
                  onChange={(e) => setNewCustomColumnTitle(e.target.value)}
                  className="flex-grow"
                  placeholder="Ex: Ideias Futuras"
                />
                <Button onClick={handleAddCustomColumn}><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
