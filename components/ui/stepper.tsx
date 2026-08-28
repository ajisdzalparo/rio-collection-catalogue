'use client';

import * as React from 'react';
import { Check, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepperProps } from '@/types/stepper.types';

export const Stepper = React.memo(function Stepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  variant = 'default',
  clickableSteps = false,
  onStepClick,
  className
}: StepperProps) {
  const isHorizontal = orientation === 'horizontal';

  if (variant === 'cards' && isHorizontal) {
    return (
      <nav aria-label="Progress" className={cn('w-full', className)}>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full list-none p-0 m-0">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted ?? idx < currentStep;
            const isActive = idx === currentStep;
            const isError = step.isError ?? false;
            const StepIcon = step.icon;
            const canClick = clickableSteps && onStepClick && (isCompleted || idx <= currentStep);

            return (
              <li key={step.id} className="min-w-0">
                <button
                  type="button"
                  disabled={!canClick}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => canClick && onStepClick(idx)}
                  className={cn(
                    'flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all relative overflow-hidden w-full text-left',
                    isActive &&
                      !isError &&
                      'border-2 border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30',
                    isCompleted && 'border-border/70 bg-card/90 shadow-2xs',
                    !isActive && !isCompleted && !isError && 'border-border/50 bg-muted/30 opacity-60',
                    isError && 'border-2 border-destructive bg-destructive/10 text-destructive',
                    canClick && 'cursor-pointer hover:border-primary/80 hover:opacity-100'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isActive && !isError && 'bg-primary text-primary-foreground shadow-sm',
                      isError && 'bg-destructive text-destructive-foreground',
                      !isActive &&
                        !isCompleted &&
                        !isError &&
                        'bg-muted text-muted-foreground border border-border/60'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-3" />
                    ) : isError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : StepIcon ? (
                      <StepIcon className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        'text-xs font-extrabold truncate',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {step.description}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  if (variant === 'pills' && isHorizontal) {
    return (
      <nav aria-label="Progress" className={cn('w-full', className)}>
        <ol className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/60 w-full overflow-x-auto list-none m-0">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted ?? idx < currentStep;
            const isActive = idx === currentStep;
            const canClick = clickableSteps && onStepClick && (isCompleted || idx <= currentStep);

            return (
              <React.Fragment key={step.id}>
                <li className="flex-1 min-w-0">
                  <button
                    type="button"
                    disabled={!canClick}
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => canClick && onStepClick(idx)}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap',
                      isActive && 'bg-card text-foreground shadow-2xs border border-border/60',
                      isCompleted && 'text-muted-foreground hover:text-foreground',
                      !isActive && !isCompleted && 'text-muted-foreground/60',
                      canClick && 'cursor-pointer'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                        isCompleted && 'bg-primary/20 text-primary',
                        isActive && 'bg-primary text-primary-foreground',
                        !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? <Check className="h-3 w-3 stroke-3" /> : idx + 1}
                    </span>
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                </li>
                {idx < steps.length - 1 && (
                  <li aria-hidden="true" className="shrink-0 hidden sm:block">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol
        className={cn(
          'w-full list-none p-0 m-0',
          isHorizontal
            ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3'
            : 'flex flex-col gap-6'
        )}
      >
        {steps.map((step, idx) => {
          const isCompleted = step.isCompleted ?? idx < currentStep;
          const isActive = idx === currentStep;
          const isError = step.isError ?? false;
          const isUpcoming = idx > currentStep && !isCompleted;
          const isLast = idx === steps.length - 1;
          const StepIcon = step.icon;
          const canClick = clickableSteps && onStepClick && (isCompleted || idx <= currentStep);

          return (
            <React.Fragment key={step.id}>
              <li className={cn('min-w-0', isHorizontal && !isLast && 'flex-1')}>
                <button
                  type="button"
                  disabled={!canClick}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => canClick && onStepClick(idx)}
                  className={cn(
                    'flex items-center gap-3 sm:gap-3.5 min-w-0 text-left bg-transparent border-0 p-0 w-full',
                    canClick ? 'cursor-pointer select-none group' : 'cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                      isCompleted && 'bg-primary text-primary-foreground shadow-xs',
                      isActive &&
                        !isError &&
                        'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md sm:scale-105',
                      isError &&
                        'bg-destructive text-destructive-foreground ring-4 ring-destructive/20 shadow-md',
                      isUpcoming && 'bg-muted/60 text-muted-foreground border border-border/70',
                      canClick && 'group-hover:scale-110'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-3" />
                    ) : isError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : StepIcon ? (
                      <StepIcon className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        'text-xs font-extrabold tracking-tight transition-colors truncate',
                        isActive && 'text-primary font-extrabold',
                        isCompleted && 'text-foreground font-bold',
                        isUpcoming && 'text-muted-foreground font-semibold',
                        isError && 'text-destructive font-extrabold'
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {step.description}
                      </span>
                    )}
                  </div>

                  {isHorizontal && !isLast && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex-1 h-0.5 rounded-full min-w-4 ml-2 transition-all duration-300 hidden sm:block',
                        idx < currentStep ? 'bg-primary' : 'bg-border/60'
                      )}
                    />
                  )}
                </button>
              </li>

              {!isHorizontal && !isLast && (
                <li aria-hidden="true" className="list-none">
                  <div
                    className={cn(
                      'w-1 ml-4 sm:ml-4.5 -mt-4 -mb-2 min-h-8 rounded-full transition-all duration-300',
                      idx < currentStep ? 'bg-primary' : 'bg-border/60'
                    )}
                  />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
});
