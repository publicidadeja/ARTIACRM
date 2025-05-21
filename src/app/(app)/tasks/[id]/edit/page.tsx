
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { CreateTaskForm } from '@/components/app/CreateTaskForm';
import { INITIAL_TASKS } from '@/lib/constants';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageTitle } from '@/components/app/PageTitle'; // Assuming this exists and is used in layout or here

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundTask = INITIAL_TASKS.find(t => t.id === taskId);
    if (foundTask) {
      setTaskToEdit(foundTask);
    } else {
      // Optionally handle task not found, e.g., redirect or show error
      console.error(`Task with ID ${taskId} not found.`);
      // router.push('/board'); // Example: redirect if task not found
    }
    setLoading(false);
  }, [taskId, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>Carregando dados da tarefa...</p>
      </div>
    );
  }

  if (!taskToEdit) {
    return (
      <div className="container mx-auto py-10">
        {/* PageTitle could be handled by layout or here */}
        {/* <PageTitle title="Erro: Tarefa não encontrada" /> */}
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl mb-6">Tarefa não encontrada</h1>
        <p>A tarefa que você está tentando editar não existe ou foi movida.</p>
        <Button asChild className="mt-4">
          <Link href="/board">Voltar ao Quadro Kanban</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      {/* PageTitle is now handled by the layout */}
      <CreateTaskForm initialTaskData={taskToEdit} isEditMode={true} />
    </div>
  );
}

    