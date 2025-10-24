import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { Tag } from 'primeng/tag';


@Component({
  selector: 'product-card',
  standalone: true,
  imports:
    [
      CommonModule,
      RouterModule,
      Toast,
      ButtonModule,
      Ripple,
      Tag
    ],
  providers: [MessageService],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  router: Router = inject(Router)

  @Input() product: any;
  @Input() first: any;
  @Input() layout: string = "";
  @Input() getSeverity: any;


  constructor(private messageService: MessageService) { }

  navigationToDetailPage() {
    this.router.navigate(['/product-detail']);
  }

  ShowSuccess() {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Added product to cart!', life: 3000 });
  }
}
