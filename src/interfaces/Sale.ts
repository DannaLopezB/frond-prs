export interface Sale {
  id?: number;
  saleDate: string;
  name: string;
  ruc: string;
  address: string;
  details: SaleDetail[];
  expanded?: boolean;
}

export interface SaleDetail {
  productId: number;
  weight: number;
  packages: number;
  totalWeight: number;
  pricePerKg: number;
  totalPrice: number;
}
