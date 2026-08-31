import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { AboutPage } from './pages/about-page/about-page';
import { ProductsPage } from './pages/products-page/products-page';
import { ProductDetailPage } from './pages/product-detail-page/product-detail-page';
import { ContactPage } from './pages/contact-page/contact-page';
import { AuthPage } from './pages/auth-page/auth-page';
import { ProfilePage } from './pages/profile-page/profile-page';
import { CartPage } from './pages/cart-page/cart-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'products', component: ProductsPage },
  { path: 'products/:slug', component: ProductDetailPage },
  { path: 'contact', component: ContactPage },
  { path: 'auth', component: AuthPage },
  { path: 'profile', component: ProfilePage },
  { path: 'cart', component: CartPage },
  { path: '**', redirectTo: '' },
];
