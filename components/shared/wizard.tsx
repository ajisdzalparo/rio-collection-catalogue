'use client';

import * as React from 'react';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardProps, WizardStepProps } from '@/types/stepper.types';
import { motion, AnimatePresence } from 'framer-motion';

export function WizardStep({ children }: WizardStepProps) {
  return <div className="space-y-4">{children}</div>;
}

export function Wizard({
  steps,
  currentStep: controlledStep,
  onStepChange,
  onFinish,
  onBeforeNext,
  orientation = 'horizontal',
  variant = 'default',
  showButtons = true,
  clickableSteps = false,
  nextText = 'Next Step',
  prevText = 'Back',
  finishText = 'Complete',
  className,
  children
}: WizardProps) {
  const [internalStep, setInternalStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const activeStep = controlledStep !== undefined ? controlledStep : internalStep;

  const setStep = (stepIdx: number) => {
    if (controlledStep === undefined) {
      setInternalStep(stepIdx);
    }
    onStepChange?.(stepIdx);
  };

  const handleNext = async () => {
    if (activeStep >= steps.length - 1) {
      onFinish?.();
      return;
    }

    if (onBeforeNext) {
      try {
        setIsLoading(true);
        const canProceed = await onBeforeNext(activeStep);
        if (!canProceed) return;
      } finally {
        setIsLoading(false);
      }
    }

    setStep(activeStep + 1);
  };

  const handlePrev = () => {
    if (activeStep <= 0) return;
    setStep(activeStep - 1);
  };

  const childrenArray = React.Children.toArray(children);
  const currentStepChild = childrenArray[activeStep] || childrenArray[0];

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className={cn('space-y-6 w-full', className)}>
      <div className="p-5 rounded-xl border border-border/70 bg-card/80 shadow-xs backdrop-blur-md">
        <Stepper
          steps={steps}
          currentStep={activeStep}
          orientation={orientation}
          variant={variant}
          clickableSteps={clickableSteps}
          onStepClick={(stepIdx) => setStep(stepIdx)}
        />
      </div>

      <div className="p-6 rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden relative min-h-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {currentStepChild}
          </motion.div>
        </AnimatePresence>
      </div>

      {showButtons && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep || isLoading}
            onClick={handlePrev}
            className="gap-2 text-xs font-bold rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{prevText}</span>
          </Button>

          <Button
            type="button"
            disabled={isLoading}
            onClick={handleNext}
            className="gap-2 text-xs font-bold rounded-lg min-w-30"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating...</span>
              </>
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4 stroke-3" />
                <span>{finishText}</span>
              </>
            ) : (
              <>
                <span>{nextText}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
