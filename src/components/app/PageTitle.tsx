import type { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  actions?: ReactNode;
}

export function PageTitle({ title, actions }: PageTitleProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
