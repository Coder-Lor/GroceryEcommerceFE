import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-wishlist.component.html',
  styleUrl: './user-wishlist.component.scss',
})
export class UserWishlistComponent {
  wishlistItems = [
    {
      id: 1,
      image: '/images/coffee-beans.png',
      name: 'Coffee Beans - Espresso Arabica and Robusta Beans',
      price: 470000,
      inStock: true
    },
    {
      id: 2,
      image: '/images/lavazza-coffee.png',
      name: 'Lavazza Coffee Blends - Try the Italian Espresso',
      price: 530000,
      inStock: true
    },
    {
      id: 3,
      image: '/images/green-tea.png',
      name: 'Organic Green Tea - Premium Quality',
      price: 290000,
      inStock: false
    }
  ];

  addToCart(item: any) {
    console.log('Adding to cart:', item);
  }

  removeFromWishlist(item: any) {
    this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}
