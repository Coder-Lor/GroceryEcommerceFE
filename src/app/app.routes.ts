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
import { CategoriesPageComponent } from './admin/categories/categories-page.component';
import { OrderListComponent } from './admin/order-management/order-list/order-list.component';
import { VouchersPageComponent } from './admin/vouchers/vouchers-page.component';
import { authGuard } from './core/service/auth.guard';
import { NotFoundComponent } from './core/components/not-found/not-found.component';
import { Checkout } from './customer/features/checkout/checkout';
import { Profile } from './customer/features/profile/profile';
import { DiscoverPage } from './customer/pages/customer-page/discover-page/discover-page';
import { OrderResult } from './customer/features/order-result/order-result';
import { PaymentPending } from './customer/features/payment-pending/payment-pending';
import { PersonalInfoComponent } from './customer/features/profile/personal-info/personal-info.component';
import { UserAddressComponent } from './customer/features/profile/user-address/user-address.component';
import { UserContactComponent } from './customer/features/profile/user-contact/user-contact.component';
import { UserBankComponent } from './customer/features/profile/user-bank/user-bank.component';
import { UserOrdersComponent } from './customer/features/profile/user-orders/user-orders.component';
import { UserWishlistComponent } from './customer/features/profile/user-wishlist/user-wishlist.component';
import { UserVouchersComponent } from './customer/features/profile/user-vouchers/user-vouchers.component';
import { AboutUsPage } from './customer/pages/info-pages/about-us/about-us-page';
import { LegalInfoPage } from './customer/pages/info-pages/legal-info/legal-info-page';
import { TermsOfUsePage } from './customer/pages/info-pages/terms-of-use/terms-of-use-page';
import { SecurePaymentPage } from './customer/pages/info-pages/secure-payment/secure-payment-page';
import { ShopManagementComponent } from './admin/shops/shop-management.component';
import { ShopDetailPage } from './customer/features/shops/shop-detail';
import { ShopRegisterPage } from './customer/features/shops/shop-register';
import { MyShopPage } from './customer/features/shops/my-shop';

const scrollOpts: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: '',
    component: CustomerPage,
    children: [
      { path: 'home', component: Home },
      { path: 'cart', component: Cart },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'shop/register', component: ShopRegisterPage },
      { path: 'shop/:shopId', component: ShopDetailPage },
      { path: 'my-shop', component: MyShopPage },
      { path: 'product-detail/:slug', component: ProductDetail },
      { path: 'category', component: ProductList },
      { path: 'checkout', component: Checkout },
      { path: 'payment-pending', component: PaymentPending },
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
      { path: 'about-us', component: AboutUsPage },
      { path: 'legal-info', component: LegalInfoPage },
      { path: 'terms-of-use', component: TermsOfUsePage },
      { path: 'secure-payment', component: SecurePaymentPage },
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
        component: OrderListComponent,
      },
      {
        path: 'categories',
        component: CategoriesPageComponent,
      },
      {
        path: 'vouchers',
        component: VouchersPageComponent,
      },
      {
        path: 'shops',
        component: ShopManagementComponent,
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
