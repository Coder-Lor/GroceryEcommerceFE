import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProductCard } from '../../shared/components/product-card/product-card';

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
export class Home {
  route: Router = inject(Router);

  layout: 'list' | 'grid' = 'grid';

  options = ['list', 'grid'];

  navigationToDetailPage() {
    this.route.navigate(['/product-detail']);
  }

  products: any[] = [
    {
      id: 1,
      name: 'product 1',
      price: 25.5,
      quantity: 1,
      image: '/images/product-image-1.png',
      inventoryStatus: 'INSTOCK',
    },
    {
      id: 2,
      name: 'product 2',
      price: 15.5,
      quantity: 1,
      image: '/images/product-image-1.png',
      inventoryStatus: 'INSTOCK',
    },
    {
      id: 3,
      name: 'product 3',
      price: 45.5,
      quantity: 1,
      image: '/images/product-image-1.png',
      inventoryStatus: 'LOWSTOCK',
    },
    {
      id: 4,
      name: 'product 4',
      price: 35.5,
      quantity: 1,
      image: '/images/product-image-1.png',
      inventoryStatus: 'OUTOFSTOCK',
    },
    {
      id: 4,
      name: 'product 4',
      price: 35.5,
      quantity: 1,
      image: '/images/product-image-1.png',
      inventoryStatus: 'INSTOCK',
    },
  ];

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
