import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';
import { Header } from '../../shared/components/header/header';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-customer-page',
  standalone: true,
  imports: [Header, RouterModule, Footer, ToastModule],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CustomerPage {}
