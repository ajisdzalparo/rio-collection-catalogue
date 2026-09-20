import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateReferralAmounts, giftEntitlement, isReferralRewardEligible, isReferralSale, netItemRevenues, normalizeReferralCode, referralReportLines } from './referral';

test('normalizes shared referral links and manual codes identically', () => {
  assert.equal(normalizeReferralCode(' rio10 '), 'RIO10');
});

test('caps a nominal discount at the product subtotal and excludes shipping', () => {
  const result = calculateReferralAmounts([{ price: 100_000, quantity: 2 }], 'NOMINAL', 500_000, 'PERCENTAGE', 10);
  assert.deepEqual(result, { subtotal: 200_000, discountAmount: 200_000, netSubtotal: 0, rewardAmount: 0 });
});

test('calculates cash reward from net products after percentage discount', () => {
  const result = calculateReferralAmounts([{ price: 100_000, quantity: 2 }], 'PERCENTAGE', 10, 'PERCENTAGE', 5);
  assert.deepEqual(result, { subtotal: 200_000, discountAmount: 20_000, netSubtotal: 180_000, rewardAmount: 9_000 });
});

test('caps flat cash reward at net product revenue', () => {
  const result = calculateReferralAmounts([{ price: 50_000, quantity: 1 }], 'NOMINAL', 45_000, 'NOMINAL', 20_000);
  assert.equal(result.netSubtotal, 5_000);
  assert.equal(result.rewardAmount, 5_000);
});

test('allocates every discount rupiah across products for reports', () => {
  const revenues = netItemRevenues([{ price: 50_000, quantity: 1 }, { price: 100_000, quantity: 1 }], 10_001);
  assert.equal(revenues.reduce((sum, value) => sum + value, 0), 139_999);
  assert.ok(revenues.every((value) => value >= 0));
});

test('reports customer discount and earned cash reward once across item rows', () => {
  const lines = referralReportLines({
    items: [{ price: 50_000, quantity: 1 }, { price: 100_000, quantity: 1 }],
    discountAmount: 10_001,
    referralRewardKind: 'CASH',
    referralRewardAmount: 7_001,
    status: 'FULFILLED'
  });
  assert.equal(lines.reduce((sum, line) => sum + line.discount, 0), 10_001);
  assert.equal(lines.reduce((sum, line) => sum + line.sales, 0), 139_999);
  assert.equal(lines.reduce((sum, line) => sum + line.cashReward, 0), 7_001);
  assert.ok(lines.every((line) => line.sales - line.cashReward >= 0));
  assert.equal(referralReportLines({ items: [{ price: 100_000, quantity: 1 }], referralRewardKind: 'CASH', referralRewardAmount: 5_000, status: 'PAID' })[0].cashReward, 0);
});

test('shirt rights carry across completed orders and subtract delivered gifts', () => {
  assert.deepEqual(giftEntitlement(19, 10, 0), { earned: 1, available: 1 });
  assert.deepEqual(giftEntitlement(21, 10, 1), { earned: 2, available: 1 });
});

test('paid sales count while cancelled orders earn no payout or shirt rights', () => {
  assert.equal(isReferralSale('PAID'), true);
  assert.equal(isReferralRewardEligible('PAID'), false);
  assert.equal(isReferralSale('FULFILLED'), true);
  assert.equal(isReferralRewardEligible('FULFILLED'), true);
  assert.equal(isReferralSale('CANCELLED'), false);
  assert.equal(isReferralRewardEligible('CANCELLED'), false);
});
