import {
  InMemoryScrollingOptions,
  provideRouter,
  Routes,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { authGuard } from './core/service/auth.guard';

const scrollOpts: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./customer/pages/customer-page/customer-page').then(m => m.CustomerPage),
    children: [
      { path: 'home', loadComponent: () => import('./customer/features/home/home').then(m => m.Home) },
      { path: 'cart', loadComponent: () => import('./customer/features/cart/cart').then(m => m.Cart) },
      { path: 'login', loadComponent: () => import('./customer/features/auth/login/login').then(m => m.Login) },
      { path: 'register', loadComponent: () => import('./customer/features/auth/register/register').then(m => m.Register) },
      { path: 'shop/register', loadComponent: () => import('./customer/features/shops/shop-register').then(m => m.ShopRegisterPage) },
      { path: 'shop/:shopId', loadComponent: () => import('./customer/features/shops/shop-detail').then(m => m.ShopDetailPage) },
      {
        path: 'my-shop',
        loadComponent: () => import('./customer/features/shops/my-shop').then(m => m.MyShopPage),
        children: [
          { path: '', redirectTo: 'inventory', pathMatch: 'full' },
          { path: 'inventory', loadComponent: () => import('./admin/inventory/inventory-page.component').then(m => m.InventoryPageComponent) },
          { path: 'orders', loadComponent: () => import('./customer/features/shops/shop-orders').then(m => m.ShopOrdersComponent) },
          { path: 'add-product', loadComponent: () => import('./admin/inventory/add-new-product/add-new-product.component').then(m => m.AddNewProductComponent) },
        ]
      },
      { path: 'product-detail/:slug', loadComponent: () => import('./customer/features/products/product-detail/product-detail').then(m => m.ProductDetail) },
      { path: 'category', loadComponent: () => import('./customer/features/products/product-list/product-list').then(m => m.ProductList) },
      { path: 'checkout', loadComponent: () => import('./customer/features/checkout/checkout').then(m => m.Checkout) },
      { path: 'payment-pending', loadComponent: () => import('./customer/features/payment-pending/payment-pending').then(m => m.PaymentPending) },
      { path: 'order-result', loadComponent: () => import('./customer/features/order-result/order-result').then(m => m.OrderResult) },
      {
        path: 'profile',
        loadComponent: () => import('./customer/features/profile/profile').then(m => m.Profile),
        children: [
          { path: '', redirectTo: 'personal-info', pathMatch: 'full' },
          { path: 'personal-info', loadComponent: () => import('./customer/features/profile/personal-info/personal-info.component').then(m => m.PersonalInfoComponent) },
          { path: 'address', loadComponent: () => import('./customer/features/profile/user-address/user-address.component').then(m => m.UserAddressComponent) },
          { path: 'contact', loadComponent: () => import('./customer/features/profile/user-contact/user-contact.component').then(m => m.UserContactComponent) },
          { path: 'bank', loadComponent: () => import('./customer/features/profile/user-bank/user-bank.component').then(m => m.UserBankComponent) },
          { path: 'orders', loadComponent: () => import('./customer/features/profile/user-orders/user-orders.component').then(m => m.UserOrdersComponent) },
          { path: 'wishlist', loadComponent: () => import('./customer/features/profile/user-wishlist/user-wishlist.component').then(m => m.UserWishlistComponent) },
          { path: 'vouchers', loadComponent: () => import('./customer/features/profile/user-vouchers/user-vouchers.component').then(m => m.UserVouchersComponent) },
        ]
      },
      { path: 'discover-page', loadComponent: () => import('./customer/pages/customer-page/discover-page/discover-page').then(m => m.DiscoverPage) },
      { path: 'about-us', loadComponent: () => import('./customer/pages/info-pages/about-us/about-us-page').then(m => m.AboutUsPage) },
      { path: 'legal-info', loadComponent: () => import('./customer/pages/info-pages/legal-info/legal-info-page').then(m => m.LegalInfoPage) },
      { path: 'terms-of-use', loadComponent: () => import('./customer/pages/info-pages/terms-of-use/terms-of-use-page').then(m => m.TermsOfUsePage) },
      { path: 'secure-payment', loadComponent: () => import('./customer/pages/info-pages/secure-payment/secure-payment-page').then(m => m.SecurePaymentPage) },
    ],
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    // canActivate: [authGuard], // Bảo vệ toàn bộ route admin
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () => import('./admin/home/home-page.component').then(m => m.HomePageComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users/users-page.component').then(m => m.UsersPageComponent),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./admin/inventory/inventory-page.component').then(m => m.InventoryPageComponent),
      },
      {
        path: 'inventory/add-new-product',
        loadComponent: () => import('./admin/inventory/add-new-product/add-new-product.component').then(m => m.AddNewProductComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/order-management/order-list/order-list.component').then(m => m.OrderListComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./admin/categories/categories-page.component').then(m => m.CategoriesPageComponent),
      },
      {
        path: 'vouchers',
        loadComponent: () => import('./admin/vouchers/vouchers-page.component').then(m => m.VouchersPageComponent),
      },
      {
        path: 'shops',
        loadComponent: () => import('./admin/shops/shop-management.component').then(m => m.ShopManagementComponent),
      },
      {
        path: 'shops/inventory',
        loadComponent: () => import('./admin/inventory/inventory-page.component').then(m => m.InventoryPageComponent),
      },
    ],
  },
  { path: '**', loadComponent: () => import('./core/components/not-found/not-found.component').then(m => m.NotFoundComponent) }, // Trang 404
];

export const appRouter = provideRouter(
  routes,
  withInMemoryScrolling(scrollOpts),
  withPreloading(PreloadAllModules) // Preload all modules for faster navigation
);
