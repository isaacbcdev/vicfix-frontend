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
