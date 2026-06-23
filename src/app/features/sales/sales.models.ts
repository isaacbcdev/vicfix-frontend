export interface SaleLineItem {
  productId: number;
  productName: string;
  productBarcode: string | null;
  quantity: number;
  pricePerUnit: number;
  costPrice: number;
  subtotal: number;
  profit: number;
  comments: string | null;
}

export interface SaleDetail {
  saleId: number;
  userName: string;
  saleDate: string;
  paymentMethodDisplay: string;
  discount: number;
  profit: number;
  total: number;
  totalCost: number;
  statusDisplay: string;
  comments: string | null;
  productsSales: SaleLineItem[];
}

export interface SaleSummary {
  saleId: number;
  saleDate: string;
  userName: string;
  paymentMethod: string;
  paymentMethodDisplay: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELED';
  statusDisplay: string;
  total: number;
  discount: number;
}

export interface CartItem {
  productId: number;
  productName: string;
  salePrice: number;
  costPrice: number;
  quantity: number;
  comments?: string;
}

export interface CreateSaleRequest {
  userId: number;
  saleDate: string;
  paymentMethod: 'CASH' | 'NEQUI';
  discount: number;
  comments: string;
  productsSales: {
    productId: number;
    quantity: number;
    comments: string;
  }[];
}
