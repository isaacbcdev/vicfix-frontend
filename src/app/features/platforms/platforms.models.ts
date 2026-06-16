export interface Platform {
  id: number;
  name: string;
  code: string;
  color: string;
  tracksTransactions: boolean;
  tracksProfit: boolean;
  profitInBalance: boolean;
  currentBalance: number;
  minimumThreshold: number | null;
  lastUpdated: string;
  createdAt: string;
  status: 'SUFFICIENT' | 'LOW' | 'CRITICAL';
}

export interface PlatformTransaction {
  id: string;
  platformId: number;
  platformName: string;
  transactionDate: string;
  operation: string;
  movementType: 'ENTRY' | 'EXIT';
  amount: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  commission: number;
  extraCharge: number | null;
  phoneNumber: string | null;
  externalId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface EfectyDailyClose {
  id: number;
  closeDate: string;
  closingBalance: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface UpdateBalanceRequest {
  currentBalance: number;
  minimumThreshold?: number;
}

export interface CreateTransactionRequest {
  platformId: number;
  transactionDate: string;
  operation: string;
  movementType: 'ENTRY' | 'EXIT';
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  commission?: number;
  extraCharge?: number;
  phoneNumber?: string;
  notes?: string;
}

export interface CreateEfectyCloseRequest {
  closeDate: string;
  closingBalance: number;
  notes?: string;
}
