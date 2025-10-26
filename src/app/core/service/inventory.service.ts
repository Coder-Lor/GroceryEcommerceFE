import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Product, InventoryReport } from '../../admin/inventory/models/product.model';
import { ProductBaseResponse, ProductClient, SortDirection } from '@services/system-admin.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();
  
  private nextId = 8;

  constructor(private productClient: ProductClient) {
    this.loadProducts();
  }

  // Load products from API
  private loadProducts(): void {
    this.productClient.getProductsPaging(
      1, // page
      1000, // pageSize - lấy nhiều để hiển thị tất cả
      undefined, // search
      undefined, // sortBy
      SortDirection.Ascending, // sortDirection
      [], // filters
      undefined, // entityType
      undefined, // availableFields
      false, // hasFilters
      false, // hasSearch
      false // hasSorting
    ).pipe(
      map(response => {
        if (response.isSuccess && response.data?.items) {
          return response.data.items;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading products:', error);
        return of([]);
      })
    ).subscribe(products => {
      this.productsSubject.next(products);
    });
  }

  // Refresh products from server
  refreshProducts(): void {
    this.loadProducts();
  }

  // Lấy danh sách sản phẩm
  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  // Lấy sản phẩm theo ID
  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find(p => p.productId === id.toString());
  }

  // Thêm sản phẩm mới
  addProduct(product: Product): void {
    const products = this.productsSubject.value;
    const newProduct = ProductBaseResponse.fromJS({
      ...product.toJSON(),
      productId: (this.nextId++).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.productsSubject.next([...products, newProduct]);
    // TODO: Call API to persist the new product
  }

  // Cập nhật sản phẩm
  updateProduct(id: number, product: Partial<Product>): void {
    const products = this.productsSubject.value;
    const index = products.findIndex(p => p.productId === id.toString());
    if (index !== -1) {
      products[index] = ProductBaseResponse.fromJS({
        ...products[index].toJSON(),
        ...product,
        updatedAt: new Date()
      });
      this.productsSubject.next([...products]);
      // TODO: Call API to persist the updated product
    }
  }

  // Xóa sản phẩm
  deleteProduct(id: number): void {
    const products = this.productsSubject.value.filter(p => p.productId !== id.toString());
    this.productsSubject.next(products);
    // TODO: Call API to persist the deletion
  }

  // Tạo báo cáo kho hàng
  generateReport(): InventoryReport {
    const products = this.productsSubject.value;
    
    return {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.cost || 0)), 0),
      lowStockProducts: products.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 0) && (p.stockQuantity || 0) > 0).length,
      outOfStockProducts: products.filter(p => (p.stockQuantity || 0) === 0).length,
      productsByCategory: this.groupProductsByPriceRange(products)
    };
  }

  // Nhóm sản phẩm theo khoảng giá
  private groupProductsByPriceRange(products: Product[]): { [key: string]: number } {
    return products.reduce((acc, product) => {
      let range: string;
      const price = product.price || 0;
      if (price < 100000) {
        range = 'Dưới 100k';
      } else if (price < 500000) {
        range = '100k - 500k';
      } else if (price < 1000000) {
        range = '500k - 1tr';
      } else {
        range = 'Trên 1tr';
      }
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }
}
