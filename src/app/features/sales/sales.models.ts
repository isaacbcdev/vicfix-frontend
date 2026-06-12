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
