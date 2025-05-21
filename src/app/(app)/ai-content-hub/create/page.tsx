
'use client';

import { AIContentCreationForm } from '@/components/app/AIContentCreationForm';
import React from 'react'; // Import React for Suspense

// O PageTitle é normalmente gerenciado pelo AppLayout, mas pode ser importado aqui se necessário
// import { PageTitle } from '@/components/app/PageTitle';

export default function CreateAIContentPage() {
  return (
    <div className="container mx-auto py-2">
      {/* Se o título da página precisar ser definido aqui, descomente a linha abaixo */}
      {/* <PageTitle title="Criar Conteúdo com IA" /> */}
      <React.Suspense fallback={<div className="text-center p-10 text-muted-foreground">Carregando formulário de criação...</div>}>
        <AIContentCreationForm />
      </React.Suspense>
    </div>
  );
}
