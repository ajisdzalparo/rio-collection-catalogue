import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-4 border-b pb-5 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
      <div className="min-w-0 space-y-1">
        <h1 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex w-full flex-wrap items-center gap-3 [&>*]:w-full sm:w-auto sm:[&>*]:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
