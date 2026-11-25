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
  resolutionNote: string | null;
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

export interface DenominationCountRequest {
  denomination: number;
  quantity: number;
}

/** One saved line of a pile; the backend returns all 11 denominations, high to low. */
export interface DenominationCount {
  denomination: number;
  quantity: number;
  subtotal: number;
}

export interface CreateDailyCloseRequest {
  closeDate: string;
  efectyReportedBalance: number;
  cashCounts: DenominationCountRequest[];
  efectyCounts: DenominationCountRequest[];
  cashBase: number | null;
  notes: string | null;
  newDebts: NewDebtEntryRequest[];
}

/** Full replacement (PUT): omitting `notes` clears them, so always send the current value. */
export interface UpdateDailyCloseRequest {
  efectyReportedBalance: number;
  cashCounts: DenominationCountRequest[];
  efectyCounts: DenominationCountRequest[];
  notes: string | null;
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
  updatedAt: string | null;
  updatedBy: string | null;
  platformBalances: PlatformBalanceLine[];
  cashCounts: DenominationCount[];
  efectyCounts: DenominationCount[];
  /**
   * TODAY's outstanding debts, not the ones outstanding on `closeDate` — the backend attaches
   * the current list to every close. Never present it as historical (history/edit views).
   */
  outstandingDebts: DebtEntry[];
  debtsCreatedInClose: DebtEntry[];
}
