import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-bank',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-bank.component.html',
  styleUrl: './user-bank.component.scss',
})
export class UserBankComponent {
  cards = [
    {
      id: 1,
      type: 'visa',
      number: '1234 4567 8901 2221',
      holder: 'TUAN NGUYEN',
      expired: '10/25',
      isDefault: true
    },
    {
      id: 2,
      type: 'mastercard',
      number: '5678 1234 5678 9012',
      holder: 'TUAN NGUYEN',
      expired: '11/26',
      isDefault: false
    }
  ];

  addNewCard() {
    console.log('Add new card');
  }

  removeCard(card: any) {
    this.cards = this.cards.filter(c => c.id !== card.id);
  }

  setDefaultCard(card: any) {
    this.cards.forEach(c => c.isDefault = false);
    card.isDefault = true;
  }

  maskCardNumber(number: string): string {
    return number.replace(/\d(?=\d{4})/g, '*');
  }
}
