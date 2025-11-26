import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static pages - prerender for better performance
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'register',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'category',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'discover-page',
    renderMode: RenderMode.Prerender
  },
  // Dynamic routes - use SSR instead of prerendering
  {
    path: 'product-detail/:slug',
    renderMode: RenderMode.Server
  },
  {
    path: 'cart',
    renderMode: RenderMode.Server
  },
  {
    path: 'checkout',
    renderMode: RenderMode.Server
  },
  {
    path: 'payment-pending',
    renderMode: RenderMode.Server
  },
  {
    path: 'order-result',
    renderMode: RenderMode.Server
  },
  {
    path: 'profile/**',
    renderMode: RenderMode.Server
  },
  // Admin routes - use SSR
  {
    path: 'admin/**',
    renderMode: RenderMode.Server
  },
  // Default fallback
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
