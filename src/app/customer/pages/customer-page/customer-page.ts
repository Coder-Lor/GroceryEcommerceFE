import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Footer } from '../../shared/components/footer/footer';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-customer-page',
  standalone: true,
  imports: [Header, RouterModule, Footer],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.scss',
})
export class CustomerPage {}
