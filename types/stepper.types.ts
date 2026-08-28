import * as React from 'react';

export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
  icon?: React.ElementType;
  isCompleted?: boolean;
  isError?: boolean;
  errorText?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed active step index
  orientation?: StepperOrientation;
  variant?: 'default' | 'pills' | 'cards';
  clickableSteps?: boolean;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export interface WizardStepProps {
  stepIndex: number;
  children: React.ReactNode;
}

export interface WizardProps {
  steps: StepItem[];
  currentStep?: number;
  onStepChange?: (newStepIndex: number) => void;
  onFinish?: () => void;
  onBeforeNext?: (currentStepIndex: number) => boolean | Promise<boolean>;
  orientation?: StepperOrientation;
  variant?: 'default' | 'pills' | 'cards';
  showButtons?: boolean;
  clickableSteps?: boolean;
  nextText?: string;
  prevText?: string;
  finishText?: string;
  className?: string;
  children: React.ReactNode;
}
