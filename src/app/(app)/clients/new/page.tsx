
'use client';

import { ClientForm } from '@/components/app/ClientForm';

export default function NewClientPage() {
  return (
    <div className="container mx-auto py-2">
      <ClientForm isEditMode={false} />
    </div>
  );
}
