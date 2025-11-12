import {
  InMemoryScrollingOptions,
  provideRouter,
  Routes,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
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
import { AddNewProductComponent } from './admin/inventory/add-new-product/add-new-product.component';
import { OrdersPageComponent } from './admin/orders/orders-page.component';
import { CategoriesPageComponent } from './admin/categories/categories-page.component';
import { authGuard } from './core/service/auth.guard';
import { NotFoundComponent } from './core/components/not-found/not-found.component';
import { Checkout } from './customer/features/checkout/checkout';
import { Profile } from './customer/features/profile/profile';
import { DiscoverPage } from './customer/pages/customer-page/discover-page/discover-page';
import { OrderResult } from './customer/features/order-result/order-result';
import { PersonalInfoComponent } from './customer/features/profile/personal-info/personal-info.component';
import { UserAddressComponent } from './customer/features/profile/user-address/user-address.component';
import { UserContactComponent } from './customer/features/profile/user-contact/user-contact.component';
import { UserBankComponent } from './customer/features/profile/user-bank/user-bank.component';
import { UserOrdersComponent } from './customer/features/profile/user-orders/user-orders.component';
import { UserWishlistComponent } from './customer/features/profile/user-wishlist/user-wishlist.component';
import { UserVouchersComponent } from './customer/features/profile/user-vouchers/user-vouchers.component';

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
      { path: 'product-detail/:slug', component: ProductDetail },      
      { path: 'category', component: ProductList },
      { path: 'checkout', component: Checkout },
      { path: 'order-result', component: OrderResult },
      { 
        path: 'profile', 
        component: Profile,
        children: [
          { path: '', redirectTo: 'personal-info', pathMatch: 'full' },
          { path: 'personal-info', component: PersonalInfoComponent },
          { path: 'address', component: UserAddressComponent },
          { path: 'contact', component: UserContactComponent },
          { path: 'bank', component: UserBankComponent },
          { path: 'orders', component: UserOrdersComponent },
          { path: 'wishlist', component: UserWishlistComponent },
          { path: 'vouchers', component: UserVouchersComponent },
        ]
      },
      { path: 'discover-page', component: DiscoverPage },
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
        path: 'inventory/add-new-product',
        component: AddNewProductComponent,
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

export const appRouter = provideRouter(
  routes,
  withInMemoryScrolling(scrollOpts),
  withPreloading(PreloadAllModules) // Preload all modules for faster navigation
);
