export function EmptyState({ message = 'No data available.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
      <p className="text-sm">{message}</p>
    </div>
  );
}
