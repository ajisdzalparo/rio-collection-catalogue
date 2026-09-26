export type CommissionMode = 'PERCENTAGE' | 'NOMINAL';

export interface PlatformFinanceSettings {
  commissionMode: CommissionMode;
  commissionValue: number;
  updatedAt: string;
}

export interface PlatformFinanceSummary {
  transactionCount: number;
  commissionTotal: number;
  averageCommission: number;
}

export interface PlatformFinanceTransaction {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  status: string;
  commissionMode: CommissionMode;
  commissionValue: number;
  baseAmount: number;
  commissionAmount: number;
}

export interface PlatformFinanceData {
  month: string;
  settings: PlatformFinanceSettings;
  summary: PlatformFinanceSummary;
  transactions: PlatformFinanceTransaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
