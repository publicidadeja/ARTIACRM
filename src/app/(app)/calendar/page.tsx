
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { INITIAL_TASKS as FALLBACK_TASKS } from '@/lib/constants'; // Renomeado para clareza
import type { Task } from '@/types';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    const storedTasks = localStorage.getItem('kanbanTasks');
    if (storedTasks) {
      try {
        setAllTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error("Error parsing tasks from localStorage on Calendar page:", e);
        setAllTasks(FALLBACK_TASKS); // Fallback to empty if error
      }
    } else {
      setAllTasks(FALLBACK_TASKS); // Fallback if no tasks in storage
    }
  }, []);
  
  const selectedDayTasks = date 
    ? allTasks.filter(task => isSameDay(parseISO(task.dueDate), date))
    : [];

  return (
    <div className="container mx-auto py-2">
      {/* PageTitle is now handled by the layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Calendário de Tarefas</CardTitle>
            <CardDescription>Selecione uma data para ver as tarefas agendadas.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              locale={ptBR}
              modifiers={{ 
                tasksDue: allTasks.map(task => parseISO(task.dueDate)) 
              }}
              modifiersStyles={{ 
                tasksDue: { fontWeight: 'bold', color: 'hsl(var(--primary))' } 
              }}
            />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              Tarefas para {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Nenhuma data selecionada'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayTasks.length > 0 ? (
              <ul className="space-y-2">
                {selectedDayTasks.map((task: Task) => (
                  <li key={task.id} className="p-3 bg-muted/50 rounded-md">
                    <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">{task.type}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {date ? 'Nenhuma tarefa para esta data.' : 'Selecione uma data no calendário.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
