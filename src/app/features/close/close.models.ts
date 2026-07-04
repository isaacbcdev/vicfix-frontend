export interface PlatformBalanceLine {
  platformId: number;
  platformCode: string;
  platformName: string;
  balance: number;
}

export interface EfectyMovement {
  id: number;
  status: 'OUT_TO_BUSINESS' | 'RETURNED';
  amount: number;
  description: string | null;
  createdInCloseId: number;
  returnedInCloseId: number | null;
  returnedAt: string | null;
  createdBy: string;
  createdAt: string;
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
  resolvedInCloseId: number | null;
  resolvedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DailyClosePreview {
  suggestedCashBase: number;
  platformBalances: PlatformBalanceLine[];
  outstandingEfectyMovements: EfectyMovement[];
  outstandingDebts: DebtEntry[];
}

export interface NewEfectyMovementRequest {
  amount: number;
  description: string | null;
}

export interface NewDebtEntryRequest {
  debtKind: DebtKind;
  amount: number;
  description: string | null;
}

export interface CreateDailyCloseRequest {
  closeDate: string;
  efectyReportedBalance: number;
  cashCounted: number;
  cashBase: number | null;
  notes: string | null;
  newEfectyMovements: NewEfectyMovementRequest[];
  resolveEfectyMovementIds: number[];
  newDebts: NewDebtEntryRequest[];
  resolveDebtIds: number[];
}

export interface DailyClose {
  id: number;
  closeDate: string;
  cashBase: number;
  cashCounted: number;
  efectyReportedBalance: number;
  platformBalanceTotal: number;
  diferencia: number;
  efectyFlotante: number;
  sobranteReal: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  platformBalances: PlatformBalanceLine[];
  outstandingEfectyMovements: EfectyMovement[];
  outstandingDebts: DebtEntry[];
}
