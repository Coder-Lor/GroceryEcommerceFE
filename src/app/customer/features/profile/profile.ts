import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  // User data - có thể lấy từ service sau
  user = {
    name: 'Imran Khan',
    registeredDate: '17th May 2022',
    email: 'tarok971a@gmail.com',
    phone: '+000 11122 2345 657',
    address: 'Bangladesh Embassy, Washington, DC 20008'
  };

  cards = [
    {
      type: 'blue',
      number: '1234 4567 8901 2221',
      holder: 'Imran Khan',
      expired: '10/22'
    },
    {
      type: 'dark',
      number: '1234 4567 8901 2221',
      holder: 'Imran Khan',
      expired: '11/22'
    }
  ];

  wishlistItems = [
    {
      image: '/images/coffee-beans.png',
      name: 'Coffee Beans - Espresso Arabica and Robusta Beans',
      price: 47.00
    },
    {
      image: '/images/lavazza-coffee.png',
      name: 'Lavazza Coffee Blends - Try the Italian Espresso',
      price: 53.00
    }
  ];

  addToCart(item: any) {
    console.log('Adding to cart:', item);
    // Implement cart logic
  }
}
