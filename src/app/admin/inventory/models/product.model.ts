import { ProductBaseResponse } from '@services/system-admin.service';

export type Product = ProductBaseResponse;

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  productsByCategory: { [key: string]: number };
}
