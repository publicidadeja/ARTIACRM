
'use client';
import { CreateTaskForm } from '@/components/app/CreateTaskForm';
import React from 'react'; // Import React for Suspense

// PageTitle is now handled by the layout

export default function NewTaskPage() {
  return (
    <div className="container mx-auto py-2">
      {/* PageTitle is now handled by the layout */}
      <React.Suspense fallback={<div className="text-center p-10 text-muted-foreground">Carregando formulário de tarefa...</div>}>
        <CreateTaskForm />
      </React.Suspense>
    </div>
  );
}
