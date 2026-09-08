'use client';

import React from 'react';
import { ConfirmModal } from './confirm-modal';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  isLoading = false,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
