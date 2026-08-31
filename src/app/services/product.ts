import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Product {
  private api = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getProducts() {
    return this.http.get<any[]>(`${this.api}/products`);
  }

  getProduct(slug: string) {
    return this.http.get<any>(`${this.api}/products/${slug}`);
  }

  // =========================================================
  // ADD TO CART
  // =========================================================
  addToCart(userId: string, productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.api}/cart`, {
      user_id: userId,
      product_id: productId,
      quantity: quantity,
    });
  }

  // =========================================================
  // GET USER CART
  // =========================================================
  getCart(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/cart/${userId}`);
  }

  // =========================================================
  // UPDATE CART QUANTITY
  // =========================================================
  updateCart(cartId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.api}/cart/${cartId}`, {
      quantity: quantity,
    });
  }

  // =========================================================
  // REMOVE CART ITEM
  // =========================================================
  removeFromCart(cartId: number): Observable<any> {
    return this.http.delete(`${this.api}/cart/${cartId}`);
  }
}
