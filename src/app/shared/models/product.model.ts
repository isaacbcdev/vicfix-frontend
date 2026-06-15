export interface Category {
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  isActive: boolean;
}

export interface Product {
  productId: number;
  categoryId: number | null;
  categoryName: string | null;
  productName: string;
  productDescription: string | null;
  productBrand: string | null;
  productStock: number;
  salePrice: number;
  costPrice: number | null;
  barcode: string | null;
  measureUnit: string;
  measureUnitDisplay: string | null;
  reorderQuantity: number;
  expirationDate: string | null;
  status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  statusDisplay: string | null;
  registerDate: string | null;
  updateDate: string | null;
}

export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
