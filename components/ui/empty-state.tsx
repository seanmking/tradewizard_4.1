import React from 'react';
import { Inbox } from 'lucide-react'; // Or any other suitable icon

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No Data",
  description = "There's nothing here yet.",
  icon = <Inbox className="h-12 w-12 text-muted-foreground/70" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-muted p-8 text-center bg-muted/30">
      <div className="rounded-full bg-muted/50 p-4 shadow-sm">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>
    </div>
  );
}
