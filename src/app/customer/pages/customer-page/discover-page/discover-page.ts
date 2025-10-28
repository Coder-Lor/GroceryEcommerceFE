import { CommonModule } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InventoryService } from '@core/service/inventory.service';
import { ProductService } from '@core/service/product.service';
import { ProductBaseResponse } from '@core/service/system-admin.service';
import { ProductCard } from 'app/customer/shared/components/product-card/product-card';
import { DataViewModule } from 'primeng/dataview';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';

import { Subject, takeUntil } from 'rxjs';

type Product = ProductBaseResponse;

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCard,
    DataViewModule,
    PaginatorModule,
    SelectButtonModule,
  ],
  templateUrl: './discover-page.html',
  styleUrl: './discover-page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DiscoverPage {
  private route: Router = inject(Router);
  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private inventoryService: InventoryService = inject(InventoryService);
  private productService: ProductService = inject(ProductService);
  private destroy$ = new Subject<void>();

  products: Product[] = [];

  layout: 'list' | 'grid' = 'grid';
  options = ['list', 'grid'];

  //paginator variable and fn()
  first: number = 0;
  rows: number = 12;
  currentPage: number = 0;
  totalRecord: number = 0;

  ngOnInit(): void {
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((param) => {
      // URL sẽ lưu page là 1-based (page=1 là trang đầu)
      const pageFromUrl = +param['page'] || 1; // default = 1
      this.rows = +param['pageSize'] || 12;

      // map về internal (0-based) để tương thích với PrimeNG paginator
      this.currentPage = Math.max(pageFromUrl - 1, 0);
      this.first = this.currentPage * this.rows;

      // load dữ liệu trang hiện tại
      this.updatePageData();
    });
  }

  onPageChange(event: PaginatorState) {
    const pageZeroBased =
      event.page !== null && event.page !== undefined
        ? event.page
        : Math.floor(this.first / this.rows) || 0;
    const pageSize = event.rows ?? this.rows;

    // cập nhật trạng thái hiển thị paginator
    this.first = event.first ?? pageZeroBased * pageSize;
    this.rows = pageSize;
    this.currentPage = pageZeroBased;

    // khi cập nhật URL, lưu page ở dạng 1-based để dễ đọc & truyền API
    const pageForUrl = pageZeroBased + 1;

    this.route.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: pageForUrl, pageSize },
      queryParamsHandling: 'merge',
    });

    // gọi API (API chờ page 1-based)
    // this.updatePageData();
  }

  updatePageData() {
    const pageForApi = this.currentPage + 1; // convert -> API expects 1-based
    this.productService
      .getProductByPaging(pageForApi, this.rows)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.products = data?.items || [];
        this.totalRecord = data?.totalCount ?? 0;
      });
  }

  navigationToDetailPage() {
    this.route.navigate(['/product-detail']);
  }

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

  navigationToProductList() {
    this.route.navigate(['/product-list']);
  }
}
