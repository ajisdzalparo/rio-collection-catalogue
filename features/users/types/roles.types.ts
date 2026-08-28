export interface RolePermissions {
  // Overview
  'overview.view'?: boolean;

  // Products
  'products.view'?: boolean;
  'products.create'?: boolean;
  'products.edit'?: boolean;
  'products.delete'?: boolean;

  // Orders
  'orders.view'?: boolean;
  'orders.process'?: boolean;
  'orders.export'?: boolean;

  // Testimonies
  'testimonies.view'?: boolean;
  'testimonies.manage'?: boolean;

  // Journal
  'journal.view'?: boolean;
  'journal.manage'?: boolean;

  // Settings
  'settings.view'?: boolean;
  'settings.manage'?: boolean;

  // Reports
  'reports.view'?: boolean;

  // Legacy fallback keys
  viewOverview?: boolean;
  manageOrders?: boolean;
  manageProducts?: boolean;
  manageJournal?: boolean;
  manageSettings?: boolean;
  viewReports?: boolean;

  [key: string]: boolean | undefined;
}

export interface UserRole {
  id?: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissions: RolePermissions;
}

export interface ActionPermission {
  key: string;
  label: string;
  description: string;
}

export interface MenuPermissionTree {
  id: string;
  menuName: string;
  description: string;
  actions: ActionPermission[];
}
