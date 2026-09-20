export interface ReferralOrderView {
  id: string;
  orderNumber: string;
  fullName: string;
  status: string;
  createdAt: string;
  discountAmount: number;
  referralRewardAmount: number;
  referralPayoutId: string | null;
  units: number;
  netProducts: number;
}

export interface ReferralGiftView {
  id: string;
  quantity: number;
  productName: string;
  size: string;
  deliveredAt: string;
  note: string | null;
}

export interface ReferralCodeView {
  id: string;
  code: string;
  isActive: boolean;
  discountMode: string;
  discountValue: number;
  rewardKind: 'CASH' | 'SHIRT';
  rewardMode: string | null;
  rewardValue: number | null;
  giftEveryUnits: number | null;
  orderCount: number;
  paidOrders: number;
  unitsSold: number;
  netRevenue: number;
  estimatedCash: number;
  payableCash: number;
  paidCash: number;
  earnedGifts: number;
  deliveredGifts: number;
  availableGifts: number;
  gifts: ReferralGiftView[];
  orders: ReferralOrderView[];
}

export interface ReferralPayoutView {
  id: string;
  amount: number;
  paidAt: string;
  note: string | null;
  orders: { id: string; orderNumber: string }[];
}

export interface ReferralPartnerView {
  id: string;
  name: string;
  whatsapp: string | null;
  notes: string | null;
  createdAt: string;
  paidOrders: number;
  customerCount: number;
  unitsSold: number;
  netRevenue: number;
  codes: ReferralCodeView[];
  payouts: ReferralPayoutView[];
}
