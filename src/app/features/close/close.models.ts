export interface PlatformBalanceLine {
  platformId: number;
  platformCode: string;
  platformName: string;
  balance: number;
}

export type DebtKind = 'PERSONAL_LOAN' | 'CUSTOMER_CREDIT';

export interface DebtEntry {
  id: number;
  debtKind: DebtKind;
  direction: 'OWED_TO_ME' | 'OWED_BY_ME';
  amount: number;
  description: string | null;
  resolved: boolean;
  createdInCloseId: number;
  resolvedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DailyClosePreview {
  suggestedCashBase: number;
  platformBalances: PlatformBalanceLine[];
  outstandingDebts: DebtEntry[];
}

export interface NewDebtEntryRequest {
  debtKind: DebtKind;
  amount: number;
  description: string | null;
}

export interface CreateDailyCloseRequest {
  closeDate: string;
  efectyReportedBalance: number;
  efectyPileCounted: number;
  cashCounted: number;
  cashBase: number | null;
  notes: string | null;
  newDebts: NewDebtEntryRequest[];
}

export interface DailyClose {
  id: number;
  closeDate: string;
  cashBase: number;
  cashCounted: number;
  efectyReportedBalance: number;
  efectyPileCounted: number;
  platformBalanceTotal: number;
  diferencia: number;
  efectyGap: number;
  sobranteReal: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  platformBalances: PlatformBalanceLine[];
  outstandingDebts: DebtEntry[];
}
