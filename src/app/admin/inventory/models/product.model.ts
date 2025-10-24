export interface Product {
  id?: number;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  cost: number;
  price: number;
  discountPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  weight: number;
  dimensions: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  productsByCategory: { [key: string]: number };
}
