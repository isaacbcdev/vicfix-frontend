export interface SupplierPhone {
  phoneId: number;
  phoneNumber: string;
  type: string;
}

export interface SupplierMail {
  mailId: number;
  mail: string;
  mailType: string;
  isActive: boolean;
}

export interface Supplier {
  supplierId: number;
  name: string;
  description: string | null;
  nit: string | null;
  website: string | null;
  businessType: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  statusDisplay: string | null;
  registerDate: string | null;
  updateDate: string | null;
  phones: SupplierPhone[];
  mails: SupplierMail[];
}

export interface CreateSupplierRequest {
  name: string;
  nit?: string;
  description?: string;
  website?: string;
  businessType?: string;
  status?: string;
}
