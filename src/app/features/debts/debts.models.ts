export type DebtKind = 'CUSTOMER_CREDIT' | 'PERSONAL_LOAN';

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

export interface ResolveDebtRequest {
  resolutionNote?: string | null;
}
