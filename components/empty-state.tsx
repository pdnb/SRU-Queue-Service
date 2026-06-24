interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div role="status" className="empty-state">
      <p className="text-lg font-medium text-foreground">{title}</p>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  );
}
