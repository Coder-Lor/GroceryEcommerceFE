import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [FormsModule, TabsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private router: Router = inject(Router);

  isFavorite: boolean = false;
  selectedValue: string = '500';
  selectedUnit: 'g' | 'kg' = 'g';
  quantity: number = 1;

  cars: any[] = [];

  reviews: Review[] = [
    { id: 1, user: 'Alice', rating: 5, comment: 'Tuyệt vời, cà phê thơm ngon!' },
    { id: 2, user: 'Bob', rating: 4, comment: 'Khá ổn, nhưng hơi đắng.' },
    { id: 3, user: 'Charlie', rating: 5, comment: 'Đóng gói đẹp, giao hàng nhanh.' },
  ];

  // toggleFavorite() {
  //   this.isFavorite = !this.isFavorite;
  // }
  navigationToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
