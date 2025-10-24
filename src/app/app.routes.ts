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
import { CustomerPage } from './customer/pages/customer-page/customer-page';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { HomePageComponent } from './admin/home/home-page.component';
import { UsersPageComponent } from './admin/users/users-page.component';
import { InventoryPageComponent } from './admin/inventory/inventory-page.component';
import { OrdersPageComponent } from './admin/orders/orders-page.component';
import { CategoriesPageComponent } from './admin/categories/categories-page.component';
import { authGuard } from './core/service/auth.guard';
import { NotFoundComponent } from './core/components/not-found/not-found.component';



const scrollOpts: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const routes: Routes = [
  {
    path: '',
    component: CustomerPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: Home },
      { path: 'cart', component: Cart },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'product-detail', component: ProductDetail },
      { path: 'product-list', component: ProductList },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    // canActivate: [authGuard], // Bảo vệ toàn bộ route admin
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        component: HomePageComponent,
      },
      {
        path: 'users',
        component: UsersPageComponent,
      },
      {
        path: 'inventory',
        component: InventoryPageComponent,
      },
      {
        path: 'orders',
        component: OrdersPageComponent,
      },
      {
        path: 'categories',
        component: CategoriesPageComponent,
      },
    ],
  },
  { path: '**', component: NotFoundComponent }, // Trang 404
];

export const appRouter = provideRouter(routes, withInMemoryScrolling(scrollOpts));
