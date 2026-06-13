export interface SalesByProductRow {
  productName: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
}

export interface SalesByProductReport {
  startDate: string;
  endDate: string;
  totalProductsSold: number;
  totalRevenue: number;
  totalProfit: number;
  rows: SalesByProductRow[];
}

export interface FinancialReport {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export interface StockRow {
  productName: string;
  category: string;
  stock: number;
  unitCost: number;
  totalValue: number;
}

export interface CategorySummary {
  stockSum: number;
  valueSum: number;
}

export interface StockReport {
  totalProducts: number;
  totalInventoryValue: number;
  averageUnitCost: number;
  rows: StockRow[];
  groupedRows: Record<string, CategorySummary>;
}

export interface CategoryBalanceRow {
  categoryName: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
}

export interface CategoryBalanceReport {
  startDate: string;
  endDate: string;
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  rows: CategoryBalanceRow[];
}

export interface CashFlowRow {
  date: string;
  description: string;
  amount: number;
  type: string;
}

export interface CashFlowReport {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  rows: CashFlowRow[];
}
