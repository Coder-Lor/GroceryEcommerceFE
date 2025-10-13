import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductList } from '../products/product-list/product-list';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductList
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  route: Router = inject(Router);

  navigationToDetailPage() {
    this.route.navigate(['/product-detail']);
  }


}
