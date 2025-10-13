import { Routes } from '@angular/router';
import { Cart } from './features/cart/cart';
import { Home } from './features/home/home';
import { ProductDetail } from './features/products/product-detail/product-detail';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'cart', component: Cart },
    { path: 'product-detail', component: ProductDetail}
];
