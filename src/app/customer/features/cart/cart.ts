import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports:
    [
      CommonModule,
      InputNumberModule,
      FormsModule,
      InputTextModule,
      RouterModule
    ],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart implements OnInit {

  Cart: any[] = [
    { id: 1, name: "product 1", price: 25.5, quantity: 1, image: '/images/product-image-1.png', inventory: true },
    { id: 2, name: "product 2", price: 15.5, quantity: 1, image: '/images/product-image-1.png', inventory: false },
    { id: 3, name: "product 3", price: 45.5, quantity: 1, image: '/images/product-image-1.png', inventory: true },
    { id: 4, name: "product 4", price: 35.5, quantity: 1, image: '/images/product-image-1.png', inventory: false },
  ]
  totalPrice: number = 0;

  ngOnInit(): void {

  }
}
