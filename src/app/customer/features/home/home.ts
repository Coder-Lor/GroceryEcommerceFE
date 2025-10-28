import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductBaseResponse } from '@core/service/system-admin.service';
import { InventoryService } from '@core/service/inventory.service';
import { ProductService } from '@core/service/product.service';
import { Subject, takeUntil } from 'rxjs';

type Product = ProductBaseResponse;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCard,
    DataViewModule,
    SelectButtonModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private route: Router = inject(Router);
  private inventoryService: InventoryService = inject(InventoryService);
  private productService: ProductService = inject(ProductService);
  private destroy$ = new Subject<void>();

  products: Product[] = [];

  layout: 'list' | 'grid' = 'grid';
  options = ['list', 'grid'];

  ngOnInit(): void {
    // this.inventoryService.loadProducts(1, 12);
    // this.inventoryService.getProducts().subscribe((data) => {
    //   this.products = data;
    // });
    this.productService
      .getProductByPaging(1, 12)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.products = data?.items || [];
        console.log(data?.items);
        console.log(this.products);
      });
  }

  navigationToDetailPage() {
    this.route.navigate(['/product-detail']);
  }

  navigationToDiscoverPage() {
    this.route.navigate(['/discover-page'], {
      queryParams: {
        page: 1,
        pageSize: 12,
      },
    });
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
