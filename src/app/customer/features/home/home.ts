import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CarouselModule } from 'primeng/carousel';
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
    CarouselModule,
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

  // Carousel configuration
  carouselImages: { url: string }[] = [];
  responsiveOptions: any[] = [];

  ngOnInit(): void {
    // Initialize carousel images
    this.carouselImages = [
      { url: '/images/banner-s25-ultra.png' },
      { url: '/images/banner-gaming.png' },
      { url: '/images/banner-watch-series-11.png' },
      { url: '/images/banner-nhacua-doisong.png' },
      { url: '/images/banner-chamsoc.png' },
      { url: '/images/banner-smartphone.png' },      
      { url: '/images/banner-maylocnuoc.png' },      
      { url: '/images/banner-honor-x6c.png' },      
    ];

    // Responsive options for carousel (2 images per slide)
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '1199px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
      }
    ];

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
