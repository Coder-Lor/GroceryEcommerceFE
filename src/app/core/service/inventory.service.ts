import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Product, InventoryReport } from '../../admin/inventory/models/product.model';
import {
  ProductBaseResponse,
  ProductClient,
  SortDirection,
  PagedResultOfProductBaseResponse,
  UpdateProductCommand,
  ResultOfUpdateProductResponse,
  FileParameter,
} from '@services/system-admin.service';

export interface PagingInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private pagingInfoSubject = new BehaviorSubject<PagingInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 12,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  public pagingInfo$ = this.pagingInfoSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private nextId = 8;
  private isInitialized = false; // Track if data has been loaded

  constructor(private productClient: ProductClient) {
    // Don't auto-load in constructor
    // Let component decide when to load
  }

  // // Initialize data (call from component)
  // initialize(): void {
  //   if (!this.isInitialized) {
  //     this.isInitialized = true;
  //     this.loadProducts(1, 10);
  //   }
  // }

  // Load products from API with paging and optional search keyword
  loadProducts(page: number = 1, pageSize: number = 12, search?: string): void {
    this.loadingSubject.next(true); // Start loading

    this.productClient
      .getProductsPaging(
        page,
        pageSize,
        search, // search
        undefined, // sortBy
        SortDirection.Ascending, // sortDirection
        [], // filters
        undefined, // entityType
        undefined, // availableFields
        false, // hasFilters
        !!search, // hasSearch
        false // hasSorting
      )
      .pipe(
        tap(() => {
          // Data is being loaded
        }),
        map((response) => {
          if (response.isSuccess && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError((error) => {
          console.error('Error loading products:', error);
          this.loadingSubject.next(false); // Stop loading on error
          return of(null);
        })
      )
      .subscribe({
        next: (pagedResult) => {
          if (pagedResult) {
            this.productsSubject.next(pagedResult.items || []);

            // Update paging info
            this.pagingInfoSubject.next({
              totalCount: pagedResult.totalCount || 0,
              totalPages: pagedResult.totalPages || 0,
              currentPage: pagedResult.page || 1,
              pageSize: pagedResult.pageSize || 10,
              hasPreviousPage: pagedResult.hasPreviousPage || false,
              hasNextPage: pagedResult.hasNextPage || false,
            });
          } else {
            // If no data, emit empty array
            this.productsSubject.next([]);
          }

          this.loadingSubject.next(false); // Stop loading when done
        },
        error: (error) => {
          console.error('Fatal error loading products:', error);
          this.productsSubject.next([]);
          this.loadingSubject.next(false); // Stop loading on error
        },
      });
  }

  // Refresh products from server
  refreshProducts(page?: number, pageSize?: number): void {
    const currentPaging = this.pagingInfoSubject.value;
    this.loadProducts(page || currentPaging.currentPage, pageSize || currentPaging.pageSize);
  }

  // Get current paging info
  getPagingInfo(): Observable<PagingInfo> {
    return this.pagingInfo$;
  }

  // Change page
  changePage(page: number): void {
    const currentPaging = this.pagingInfoSubject.value;
    if (page >= 1 && page <= currentPaging.totalPages) {
      this.loadProducts(page, currentPaging.pageSize);
    }
  }

  // Change page size
  changePageSize(pageSize: number): void {
    this.loadProducts(1, pageSize); // Reset to page 1 when changing page size
  }

  // Lấy danh sách sản phẩm
  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  // Lấy sản phẩm theo ID
  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find((p) => p.productId === id.toString());
  }

  // Thêm sản phẩm mới
  addProduct(product: Product): void {
    const products = this.productsSubject.value;
    const newProduct = ProductBaseResponse.fromJS({
      ...product.toJSON(),
      productId: (this.nextId++).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.productsSubject.next([...products, newProduct]);
    // TODO: Call API to persist the new product
  }

  // Cập nhật sản phẩm (gọi API)
  updateProductToServer(command: UpdateProductCommand): Observable<ResultOfUpdateProductResponse> {
    this.loadingSubject.next(true);

    return this.productClient.update(command).pipe(
      tap((response) => {
        this.loadingSubject.next(false);
        if (response.isSuccess) {
          // Refresh danh sách sản phẩm sau khi cập nhật thành công
          this.refreshProducts();
        }
      }),
      catchError((error) => {
        console.error('Error updating product:', error);
        this.loadingSubject.next(false);
        return of({
          isSuccess: false,
          errorMessage: 'Đã có lỗi xảy ra khi cập nhật sản phẩm',
        } as ResultOfUpdateProductResponse);
      })
    );
  }

  // Cập nhật sản phẩm (local - legacy)
  updateProduct(id: number, product: Partial<Product>): void {
    const products = this.productsSubject.value;
    const index = products.findIndex((p) => p.productId === id.toString());
    if (index !== -1) {
      products[index] = ProductBaseResponse.fromJS({
        ...products[index].toJSON(),
        ...product,
        updatedAt: new Date(),
      });
      this.productsSubject.next([...products]);
      // TODO: Call API to persist the updated product
    }
  }

  // Xóa sản phẩm
  deleteProduct(id: number): void {
    const products = this.productsSubject.value.filter((p) => p.productId !== id.toString());
    this.productsSubject.next(products);
    // TODO: Call API to persist the deletion
  }

  // Tạo báo cáo kho hàng
  generateReport(): InventoryReport {
    const products = this.productsSubject.value;

    return {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + (p.stockQuantity || 0) * (p.cost || 0), 0),
      lowStockProducts: products.filter(
        (p) => (p.stockQuantity || 0) <= (p.minStockLevel || 0) && (p.stockQuantity || 0) > 0
      ).length,
      outOfStockProducts: products.filter((p) => (p.stockQuantity || 0) === 0).length,
      productsByCategory: this.groupProductsByPriceRange(products),
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
