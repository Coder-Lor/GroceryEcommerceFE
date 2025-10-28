import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  checkoutForm: FormGroup;

  products = [
    { id: 1, name: 'Dầu gội Dove 640ml', price: 95000, quantity: 1, image: '/images/shampoo.jpg' },
    { id: 2, name: 'Sữa tươi Vinamilk 1L', price: 32000, quantity: 2, image: '/images/milk.jpg' },
  ];

  constructor(private fb: FormBuilder) {
    this.checkoutForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      paymentMethod: ['cod'],
    });
  }

  get totalPrice() {
    return this.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }

  placeOrder() {
    if (this.checkoutForm.invalid) return;
    alert('Đặt hàng thành công 🎉');
  }
}
