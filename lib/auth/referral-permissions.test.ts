import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveReferralAccess } from './referral-permissions';

const none = { canView: false, canManage: false, canSettle: false };
const all = { canView: true, canManage: true, canSettle: true };

test('existing Owner keeps referral access until a permission is explicitly disabled', () => {
  assert.deepEqual(resolveReferralAccess('Owner', null), all);
  assert.deepEqual(resolveReferralAccess('Owner', {
    isActive: true,
    permissions: { 'referrals.view': true, 'referrals.manage': false, 'referrals.settle': true }
  }), { canView: true, canManage: false, canSettle: true });
});

test('custom roles receive only explicitly granted referral actions', () => {
  assert.deepEqual(resolveReferralAccess('Sales', {
    isActive: true,
    permissions: { 'referrals.view': true, 'referrals.manage': true }
  }), { canView: true, canManage: true, canSettle: false });
  assert.deepEqual(resolveReferralAccess('Sales', {
    isActive: true,
    permissions: { 'referrals.settle': true }
  }), none);
});

test('inactive roles are blocked and Super Admin retains full access', () => {
  assert.deepEqual(resolveReferralAccess('Owner', { isActive: false, permissions: {} }), none);
  assert.deepEqual(resolveReferralAccess('Super Admin', { isActive: true, permissions: {} }), all);
});
