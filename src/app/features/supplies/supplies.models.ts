export interface Supply {
  supplyId: number;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  pricePerUnit: number;
  quantity: number;
  totalAmount: number;
  supplyDate: string;
  status: 'PENDING' | 'DELIVERED' | 'CANCELED';
  statusDisplay: string;
  comments: string | null;
}

export interface CreateSupplyRequest {
  supplierId: number;
  productId: number;
  pricePerUnit: number;
  quantity: number;
  supplyDate: string;
  status: 'PENDING' | 'DELIVERED';
  comments?: string;
}
