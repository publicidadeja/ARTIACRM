
'use client';

import { AgentForm } from '@/components/app/AgentForm';
import { PageTitle } from '@/components/app/PageTitle';

export default function NewAIAgentPage() {
  return (
    <div className="container mx-auto py-2">
      {/* PageTitle é gerenciado pelo layout global */}
      <AgentForm />
    </div>
  );
}
