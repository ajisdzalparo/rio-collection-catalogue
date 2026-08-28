export function ErrorState({ message = 'An error occurred.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-destructive text-center">
      <p className="text-sm font-medium">Error: {message}</p>
    </div>
  );
}
