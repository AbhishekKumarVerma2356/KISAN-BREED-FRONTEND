import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SiteData {
  private http = inject(HttpClient);

  private cartCountSubject = new BehaviorSubject<number>(0);

  cartCount$ = this.cartCountSubject.asObservable();

  // =========================================================
  // BACKEND
  // =========================================================

  private api = 'http://localhost:8000';

  // =========================================================
  // PRODUCTS
  // =========================================================

  getProduct(slug: string): Observable<any> {
    return this.http.get<any>(`${this.api}/products/${encodeURIComponent(slug)}`);
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/products`);
  }

  // =========================================================
  // SITE
  // =========================================================

  getSite(): Observable<any> {
    return this.http.get<any>(`${this.api}/site`);
  }

  // =========================================================
  // TESTIMONIALS
  // =========================================================

  getTestimonials(): Observable<any> {
    return this.http.get<any>(`${this.api}/testimonials`);
  }

  // =========================================================
  // FAQS
  // =========================================================

  getFaqs(): Observable<any> {
    return this.http.get<any>(`${this.api}/faqs`);
  }

  // =========================================================
  // GALLERY
  // =========================================================

  getGallery(): Observable<any> {
    return this.http.get<any>(`${this.api}/gallery`);
  }

  // =========================================================
  // CERTIFICATES
  // =========================================================

  getCertificates(): Observable<any> {
    return this.http.get<any>(`${this.api}/certificates`);
  }

  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(userId: string, productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.api}/cart`, {
      user_id: userId,
      product_id: productId,
      quantity: quantity,
    });
  }

  // =====================================================
  // GET CART
  // =====================================================

  getCart(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/cart/${userId}`);
  }

  // =====================================================
  // LOAD CART COUNT
  // =====================================================

  loadCartCount(userId: string): void {
    this.getCart(userId).subscribe({
      next: (cartItems: any[]) => {
        const count = (cartItems || []).reduce(
          (total, item) => total + Number(item.cart_quantity || 0),
          0,
        );

        this.cartCountSubject.next(count);
      },

      error: (err) => {
        console.error('Cart count loading error:', err);
        this.cartCountSubject.next(0);
      },
    });
  }

  // =====================================================
  // SET CART COUNT DIRECTLY
  // =====================================================

  updateCartCount(cartItems: any[]): void {
    const count = (cartItems || []).reduce(
      (total, item) => total + Number(item.cart_quantity || 0),
      0,
    );

    this.cartCountSubject.next(count);
  }

  // =====================================================
  // UPDATE CART
  // =====================================================

  updateCart(cartId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.api}/cart/${cartId}`, {
      quantity: quantity,
    });
  }

  // =====================================================
  // DELETE CART
  // =====================================================

  deleteCart(cartId: number): Observable<any> {
    return this.http.delete(`${this.api}/cart/${cartId}`);
  }

  // =====================================================
  // CONTACT
  // =====================================================

  submitContact(data: {
    name: string;
    phone: string;
    email: string;
    message: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.api}/contact`, data);
  }

  // =========================================================
  // GET REVIEWS FOR PRODUCT
  // =========================================================

  getProductReviews(productId: number, rating?: number): Observable<any> {
    let url = `${this.api}/reviews/product/${productId}`;

    if (rating && rating >= 1 && rating <= 5) {
      url += `?rating=${rating}`;
    }

    return this.http.get<any>(url);
  }

  // =========================================================
  // ADD REVIEW
  // =========================================================

  addReview(
    productId: number,
    rating: number,
    title: string,
    content: string,
    image?: File,
  ): Observable<any> {
    const formData = new FormData();

    formData.append('product_id', productId.toString());

    formData.append('rating', rating.toString());

    formData.append('title', title);

    formData.append('content', content);

    if (image) {
      formData.append('image', image);
    }

    return this.http.post<any>(`${this.api}/reviews`, formData);
  }
}
