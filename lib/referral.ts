export type BenefitMode = 'PERCENTAGE' | 'NOMINAL';
export const REFERRAL_STORAGE_KEY = 'rio-referral-code';
export const DEFAULT_REPORT_HPP = 180_000;

export function isReferralSale(status: string): boolean {
  return status === 'PAID' || status === 'FULFILLED';
}

export function isReferralRewardEligible(status: string): boolean {
  return status === 'FULFILLED';
}

export interface PricedItem {
  price: number;
  quantity: number;
}

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase();
}

export function calculateBenefit(base: number, mode: BenefitMode, value: number): number {
  if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Nilai referral tidak valid.');
  }
  return mode === 'PERCENTAGE' ? Math.round((base * value) / 100) : value;
}

export function calculateReferralAmounts(
  items: PricedItem[],
  discountMode: BenefitMode,
  discountValue: number,
  rewardMode?: BenefitMode | null,
  rewardValue?: number | null
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.min(subtotal, calculateBenefit(subtotal, discountMode, discountValue));
  const netSubtotal = subtotal - discountAmount;
  const rewardAmount = rewardMode && rewardValue !== null && rewardValue !== undefined
    ? Math.min(netSubtotal, calculateBenefit(netSubtotal, rewardMode, rewardValue))
    : 0;
  return { subtotal, discountAmount, netSubtotal, rewardAmount };
}

/** Allocates an order-level discount to item rows without losing rounding rupiah. */
export function netItemRevenues(items: PricedItem[], discountAmount: number): number[] {
  const gross = items.map((item) => item.price * item.quantity);
  const allocated = allocateAmountByWeights(gross, discountAmount);
  return gross.map((amount, index) => amount - allocated[index]);
}

export function allocateAmountByWeights(weights: number[], amount: number): number[] {
  const subtotal = weights.reduce((sum, value) => sum + value, 0);
  if (subtotal <= 0 || amount <= 0) return weights.map(() => 0);
  const capped = Math.min(subtotal, amount);
  let allocated = 0;
  return weights.map((weight, index) => {
    const share = index === weights.length - 1
      ? capped - allocated
      : Math.floor((capped * weight) / subtotal);
    allocated += share;
    return share;
  });
}

export interface ReferralReportOrder {
  items: PricedItem[];
  discountAmount?: number | null;
  referralRewardKind?: string | null;
  referralRewardAmount?: number | null;
  status: string;
}

export function referralReportLines(order: ReferralReportOrder) {
  const gross = order.items.map((item) => item.price * item.quantity);
  const discounts = allocateAmountByWeights(gross, order.discountAmount ?? 0);
  const sales = gross.map((amount, index) => amount - discounts[index]);
  const cashRewards = order.status === 'FULFILLED' && order.referralRewardKind === 'CASH'
    ? allocateAmountByWeights(sales, order.referralRewardAmount ?? 0)
    : sales.map(() => 0);
  return gross.map((amount, index) => ({
    grossSales: amount,
    discount: discounts[index],
    sales: sales[index],
    cashReward: cashRewards[index]
  }));
}

export function referralGiftCost(gift: { quantity: number; unitCogs: number | null }): number {
  return gift.quantity * (gift.unitCogs ?? DEFAULT_REPORT_HPP);
}

export function giftEntitlement(fulfilledUnits: number, everyUnits: number, delivered: number) {
  if (!Number.isSafeInteger(everyUnits) || everyUnits <= 0) throw new Error('Target hadiah tidak valid.');
  const earned = Math.floor(fulfilledUnits / everyUnits);
  return { earned, available: Math.max(0, earned - delivered) };
}
