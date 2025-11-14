import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/paginator';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InventoryService } from '@core/service/inventory.service';

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

  onPageChange(event: PaginatorState) {
    const newFirst = event.first ?? 0;
    const newRows = event.rows ?? this.rows;
    const page = Math.floor(newFirst / newRows) + 1;
    const size = newRows;
    this.router.navigate(['/category'], {
      queryParams: { search: this.keyword || null, page, size },
      queryParamsHandling: 'merge',
    });
  }

  showMoreCategory = false;
  showMoreLocation = false;

  cities = ['Vĩnh Phúc', 'Hà Nội', 'TP. Hồ Chí Minh', 'Thái Nguyên'];
  moreCities = ['Đà Nẵng', 'Cần Thơ', 'Huế', 'Bình Dương'];

  toggleCategory() {
    this.showMoreCategory = !this.showMoreCategory;
  }

  toggleLocation() {
    this.showMoreLocation = !this.showMoreLocation;
  }

  sortByPrice: any[] = [{ title: 'Giá: Thấp đến cao' }, { title: 'Giá: Cao đến thấp' }];
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
    // Subscribe products and paging info from service
    this.inventoryService
      .getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.products = items as any[];
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
      this.keyword = (params['search'] ?? '').toString().trim();
      const page = +(params['page'] ?? 1);
      const size = +(params['size'] ?? this.rows);
      this.first = (page - 1) * size;
      this.inventoryService.loadProducts(page, size, this.keyword || undefined);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
