export interface RolePermissions {
  // Overview
  'overview.view'?: boolean;

  // Products
  'products.view'?: boolean;
  'products.create'?: boolean;
  'products.edit'?: boolean;
  'products.delete'?: boolean;

  // Stock management
  'stock.view'?: boolean;
  'stock.manage'?: boolean;

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

  // Referral partners, codes, and rewards
  'referrals.view'?: boolean;
  'referrals.manage'?: boolean;
  'referrals.settle'?: boolean;

  // Platform finance — Super Admin only
  'platform.finance.view'?: boolean;

  // Activity log — Owner and Super Admin only
  'activity.view'?: boolean;

  // Users & Security RBAC
  'users.view'?: boolean;
  'users.manage'?: boolean;
  'users.reset_password'?: boolean;
  'users.delete'?: boolean;

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
  isActive?: boolean;
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
