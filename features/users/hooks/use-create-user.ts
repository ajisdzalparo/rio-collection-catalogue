'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateUserSchema } from '../schemas/schema';
import { createUserSchema } from '../schemas/schema';
import { useCreateUserMutation } from '../api/create-user';

export function useCreateUser() {
  const createUserMutation = useCreateUserMutation();

  const form = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: ''
    }
  });

  async function onSubmit(data: CreateUserSchema) {
    try {
      await createUserMutation.mutateAsync(data);
      form.reset();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  }

  return { form, onSubmit, isLoading: createUserMutation.isPending };
}
