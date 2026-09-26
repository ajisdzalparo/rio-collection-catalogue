import { PERMISSION_TREE } from '@/features/users/data/permission-tree';
import type { RolePermissions } from '@/features/users/types/roles.types';
import { isOwnerRole, isSuperAdminRole } from './roles';

export function parseRolePermissions(value: unknown): RolePermissions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
  );
}

export function syncRolePermissions(permissions?: RolePermissions, roleName?: string): RolePermissions {
  const synced: RolePermissions = {};
  const normalizedRole = (roleName || '').toLowerCase().trim();
  const hasGranularPermissions = PERMISSION_TREE.some((menu) =>
    menu.actions.some((action) => permissions?.[action.key] !== undefined)
  );

  if (isSuperAdminRole(roleName)) {
    PERMISSION_TREE.forEach((menu) => menu.actions.forEach((action) => { synced[action.key] = true; }));
    synced['platform.finance.view'] = true;
    synced.viewOverview = true;
    synced.manageOrders = true;
    synced.manageProducts = true;
    synced.manageJournal = true;
    synced.manageSettings = true;
    synced.viewReports = true;
    return synced;
  }

  // Preserve broad legacy grants until the role has granular action flags.
  if (
    !hasGranularPermissions &&
    (normalizedRole === 'admin' || normalizedRole === 'owner' ||
      normalizedRole === 'developer' || normalizedRole.includes('admin'))
  ) {
    PERMISSION_TREE.forEach((menu) => menu.actions.forEach((action) => {
      synced[action.key] = menu.id !== 'referrals' || isOwnerRole(roleName);
    }));
    synced.viewOverview = true;
    synced.manageOrders = true;
    synced.manageProducts = true;
    synced.manageJournal = true;
    synced.manageSettings = true;
    synced.viewReports = true;
    return synced;
  }

  if (!permissions) return synced;
  Object.assign(synced, permissions);

  const checkAndSync = (key: string, legacyValue: boolean) => {
    if (synced[key] === undefined) synced[key] = legacyValue;
  };
  const hasLegacy = (key: string) => permissions[key] === true;

  checkAndSync('overview.view', hasLegacy('viewOverview'));
  const ordersVal = hasLegacy('manageOrders');
  checkAndSync('orders.view', ordersVal);
  checkAndSync('orders.process', ordersVal);
  checkAndSync('orders.export', ordersVal);
  const productsVal = hasLegacy('manageProducts');
  checkAndSync('products.view', productsVal);
  checkAndSync('products.create', productsVal);
  checkAndSync('products.edit', productsVal);
  checkAndSync('products.delete', productsVal);
  checkAndSync('stock.view', Boolean(synced['products.view']) || productsVal);
  checkAndSync('stock.manage', Boolean(synced['products.edit']) || productsVal);
  const journalVal = hasLegacy('manageJournal');
  checkAndSync('journal.view', journalVal);
  checkAndSync('journal.manage', journalVal);
  checkAndSync('testimonies.view', journalVal);
  checkAndSync('testimonies.manage', journalVal);
  const settingsVal = hasLegacy('manageSettings');
  checkAndSync('settings.view', settingsVal);
  checkAndSync('settings.manage', settingsVal);
  checkAndSync('reports.view', hasLegacy('viewReports'));
  checkAndSync('referrals.view', isOwnerRole(roleName));
  checkAndSync('referrals.manage', isOwnerRole(roleName));
  checkAndSync('referrals.settle', isOwnerRole(roleName));
  checkAndSync('activity.view', isOwnerRole(roleName) || isSuperAdminRole(roleName));

  if (normalizedRole === 'manager') {
    checkAndSync('users.view', true);
    checkAndSync('users.manage', true);
    checkAndSync('users.reset_password', true);
    checkAndSync('users.delete', false);
  }
  return synced;
}
