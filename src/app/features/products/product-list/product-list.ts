import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { PaginatorState } from 'primeng/paginator';
import { ProductCard } from '../../../shared/components/product-card/product-card';

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
export class ProductList {
  layout: 'list' | 'grid' = 'grid';

  options = ['list', 'grid'];

  //paginator variable and fn()
  first: number = 0;
  rows: number = 10;

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
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
}
