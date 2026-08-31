import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SiteData } from '../../services/site-data';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products-page.html',
  styleUrls: ['./products-page.css'],
})
export class ProductsPage {
  // =========================================================
  // DEPENDENCIES
  // =========================================================

  private service = inject(SiteData);
  private router = inject(Router);

  // =========================================================
  // PRODUCTS
  // =========================================================

  pageData$ = this.service.getProducts().pipe(
    map((products: any[]) => ({
      products,
      isLoading: false,
    })),

    catchError((error) => {
      console.error('Products load error:', error);

      return of({
        products: [],
        isLoading: false,
      });
    }),
  );

  // =========================================================
  // GET LOGGED-IN USER
  // =========================================================

  private getUserId(): string | null {
    const userData = sessionStorage.getItem('user');

    if (!userData) {
      return null;
    }

    try {
      const user = JSON.parse(userData);

      return user?.id ?? null;
    } catch (error) {
      console.error('Invalid user session:', error);

      return null;
    }
  }

  // =========================================================
  // ADD TO CART
  // =========================================================

  addToCart(product: any): void {
    // Coming Soon products cannot be purchased
    if (product.category?.toLowerCase() === 'coming soon') {
      return;
    }

    const userId = this.getUserId();

    if (!userId) {
      alert('Please login to add products to your cart.');

      this.router.navigate(['/login']);

      return;
    }

    this.service.addToCart(userId, product.id, 1).subscribe({
      next: (response: any) => {
        console.log('Cart response:', response);

        alert(product.name + ' added to cart');
      },

      error: (error) => {
        console.error('Add to cart error:', error);

        if (error.status === 401) {
          alert('Please login again.');

          this.router.navigate(['/login']);
        } else {
          alert('Unable to add product to cart.');
        }
      },
    });
  }

  // =========================================================
  // BUY NOW
  // =========================================================

  buyNow(product: any): void {
    // Coming Soon products cannot be purchased
    if (product.category?.toLowerCase() === 'coming soon') {
      return;
    }

    const userId = this.getUserId();

    if (!userId) {
      alert('Please login to continue.');

      this.router.navigate(['/login']);

      return;
    }

    this.service.addToCart(userId, product.id, 1).subscribe({
      next: () => {
        this.router.navigate(['/cart']);
      },

      error: (error) => {
        console.error('Buy now error:', error);

        alert('Unable to proceed. Please try again.');
      },
    });
  }

  // =========================================================
  // RATING STARS
  // =========================================================

  getRatingStars(rating: number): string[] {
    const roundedRating = Math.round(rating || 0);

    return Array.from({ length: 5 }, (_, index) => (index < roundedRating ? '★' : '☆'));
  }

  // =========================================================
  // CHECK COMING SOON
  // =========================================================

  isComingSoon(product: any): boolean {
    return product.category?.toLowerCase() === 'coming soon';
  }
}
