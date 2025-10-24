import {
  InMemoryScrollingOptions,
  provideRouter,
  Routes,
  withInMemoryScrolling,
} from '@angular/router';
import { Cart } from './customer/features/cart/cart';
import { Home } from './customer/features/home/home';
import { ProductDetail } from './customer/features/products/product-detail/product-detail';
import { Login } from './customer/features/auth/login/login';
import { Register } from './customer/features/auth/register/register';
import { ProductList } from './customer/features/products/product-list/product-list';

const scrollOpts: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'cart', component: Cart },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'product-detail', component: ProductDetail },
  { path: 'product-list', component: ProductList },
  { path: '**', redirectTo: 'home' },
];

export const appRouter = provideRouter(routes, withInMemoryScrolling(scrollOpts));
