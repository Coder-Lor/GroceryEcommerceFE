import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InventoryService } from '@core/service/inventory.service';
import { CategoryService } from '@core/service/category.service';
import { CategoryDto, SortDirection } from '@core/service/system-admin.service';

@Component({
  selector: 'product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DataViewModule,
    Select,
    PaginatorModule,
    SkeletonModule,
    ProductCard,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ProductList implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private categoryService = inject(CategoryService);
  private destroy$ = new Subject<void>();

  layout: 'list' | 'grid' = 'grid';

  options = ['list', 'grid'];

  // paginator state
  first: number = 0;
  rows: number = 12;

  // data state
  products: any[] = [];
  totalRecords: number = 0;
  keyword: string = '';
  categoryId: string = '';
  loading: boolean = true;


  // categories state
  categories: CategoryDto[] = [];
  loadingCategories: boolean = true;
  expandedCategories: Set<string> = new Set();

  onPageChange(event: PaginatorState) {
    const newFirst = event.first ?? 0;
    const newRows = event.rows ?? this.rows;
    const page = Math.floor(newFirst / newRows) + 1;
    const size = newRows;
    this.router.navigate(['/category'], {
      queryParams: {
        search: this.keyword || null,
        page,
        size,
        categoryId: this.categoryId || null
      },
      queryParamsHandling: 'merge',
    });
  }

  showMoreCategory = false;
  showMoreLocation = false;

  toggleCategory() {
    this.showMoreCategory = !this.showMoreCategory;
  }

  toggleLocation() {
    this.showMoreLocation = !this.showMoreLocation;
  }

  sortByPrice: any[] = [{ title: 'Giá: Thấp đến cao', value: SortDirection.Ascending }, { title: 'Giá: Cao đến thấp', value: SortDirection.Descending }];
  selectField: any;

  getSeverity(product: any) {
    switch (product.inventoryStatus) {
      case 'INSTOCK':
        return 'success';

      case 'LOWSTOCK':
        return 'warn';

      case 'OUTOFSTOCK':
        return 'danger';

      default:
        return null;
    }
  }

  ngOnInit(): void {
    // Load categories
    this.loadCategories();

    // Subscribe products and paging info from service
    this.inventoryService
      .getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.products = items as any[];
        this.loading = false;
      });
    this.inventoryService
      .getPagingInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((paging) => {
        this.totalRecords = paging.totalCount;
        this.rows = paging.pageSize;
        this.first = (paging.currentPage - 1) * paging.pageSize;
      });

    // React to query params changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.loading = true;
      this.keyword = (params['search'] ?? '').toString().trim();
      this.categoryId = (params['categoryId'] ?? '').toString().trim();
      const page = +(params['page'] ?? 1);
      const size = +(params['size'] ?? this.rows);
      this.first = (page - 1) * size;
      const sortBy = (params['sortBy'] ?? '').toString().trim();
      const sortDirection = (params['sortDirection'] ?? SortDirection.Ascending).toString().trim();
      this.inventoryService.loadProducts(page, size, this.keyword || undefined, this.categoryId || undefined, sortBy || undefined, sortDirection || undefined);
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService
      .getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories) => {
        this.categories = categories;
        this.loadingCategories = false;
      });
  }

  filterByCategory(categoryId: string | undefined): void {
    this.router.navigate(['/category'], {
      queryParams: {
        categoryId: categoryId || null,
        page: 1,
        size: this.rows,
        search: this.keyword || null
      },
      queryParamsHandling: 'merge',
    });
  }

  toggleCategoryExpand(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
  }

  isCategoryActive(categoryId: string | undefined): boolean {
    return this.categoryId === categoryId;
  }

  filterByPrice(categoryId: string): void {
    this.router.navigate(['/category'], {
      queryParams: {
        categoryId: categoryId || null,
        page: 1,
        size: this.rows,
        search: this.keyword || null,
        sortBy: 'discountPrice',
        sortDirection: this.selectField.value
      },
      queryParamsHandling: 'merge',
    });
  }

  filterByNewest(): void {
    this.router.navigate(['/category'], {
      queryParams: {
        categoryId: this.categoryId || null,
        page: 1,
        size: this.rows,
        search: this.keyword || null,
        sortBy: 'createdAt',
        sortDirection: SortDirection.Descending
      },
      queryParamsHandling: 'merge',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
