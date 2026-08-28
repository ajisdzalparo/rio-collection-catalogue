'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { UserTable, UserFormDialog } from '@/features/users';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function UsersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View, search, create, and manage user accounts in your system."
      >
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </PageHeader>

      <UserTable />

      <UserFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
