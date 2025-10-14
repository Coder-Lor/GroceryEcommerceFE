import { InMemoryScrollingOptions, provideRouter, Routes, withInMemoryScrolling } from '@angular/router';
import { Cart } from './features/cart/cart';
import { Home } from './features/home/home';
import { ProductDetail } from './features/products/product-detail/product-detail';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

const scrollOpts: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'home', component: Home },
    { path: 'cart', component: Cart },
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'product-detail', component: ProductDetail},
    { path: '**', redirectTo: "home"}
];

export const appRouter = provideRouter(routes, withInMemoryScrolling(scrollOpts));
