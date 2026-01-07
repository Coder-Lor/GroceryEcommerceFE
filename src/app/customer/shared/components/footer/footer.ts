import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProxyImagePipe } from '@shared/pipes/proxy-image.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, ProxyImagePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  //Icons

  //Social Icons


  //payment images
  paymentImages = [
    { name: 'Visa', image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png' },
    { name: 'MasterCard', image: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png' },
    { name: 'PayPal', image: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
    { name: 'VNPAY', image: 'https://static.cdnlogo.com/logos/v/99/vnpay.svg' }
  ]

}
