import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { SiteData } from '../../services/site-data';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css'],
})
export class CartPage implements OnInit {
  // =====================================================
  // SERVICES
  // =====================================================

  private service = inject(SiteData);

  private cdr = inject(ChangeDetectorRef);

  // =====================================================
  // CART
  // =====================================================

  cartItems: any[] = [];

  // =====================================================
  // USER
  // =====================================================

  user: any = null;

  // =====================================================
  // LOADING
  // =====================================================

  isLoading = true;

  // =====================================================
  // ERROR
  // =====================================================

  errorMessage = '';

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    console.log('====================================');
    console.log('CART PAGE INITIALIZED');
    console.log('====================================');

    const userData = sessionStorage.getItem('user');

    console.log('USER FROM SESSION:', userData);

    // ===================================================
    // USER NOT FOUND
    // ===================================================

    if (!userData) {
      this.isLoading = false;

      this.errorMessage = 'Please login to view your cart.';

      this.cdr.detectChanges();

      console.error('User not logged in');

      return;
    }

    // ===================================================
    // PARSE USER
    // ===================================================

    try {
      this.user = JSON.parse(userData);

      console.log('PARSED USER:', this.user);

      // =================================================
      // USER ID CHECK
      // =================================================

      if (!this.user?.id) {
        this.isLoading = false;

        this.errorMessage = 'User ID not found.';

        this.cdr.detectChanges();

        console.error('User ID not found:', this.user);

        return;
      }

      // =================================================
      // LOAD CART
      // =================================================

      console.log('Loading cart for user:', this.user.id);

      this.loadCart();
    } catch (error) {
      console.error('Invalid user session:', error);

      this.isLoading = false;

      this.errorMessage = 'Invalid user session. Please login again.';

      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // LOAD CART
  // =====================================================

  loadCart(): void {
    console.log('====================================');
    console.log('LOAD CART');
    console.log('====================================');

    // ---------------------------------------------------
    // START LOADING
    // ---------------------------------------------------

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.detectChanges();

    // ---------------------------------------------------
    // GET USER ID
    // ---------------------------------------------------

    const userId = this.user?.id;

    console.log('GET CART USER ID:', userId);

    // ---------------------------------------------------
    // USER ID NOT FOUND
    // ---------------------------------------------------

    if (!userId) {
      this.isLoading = false;

      this.errorMessage = 'User ID is missing.';

      this.cdr.detectChanges();

      return;
    }

    // ---------------------------------------------------
    // API CALL
    // ---------------------------------------------------

    this.service.getCart(userId).subscribe({
      // =================================================
      // SUCCESS
      // =================================================

      next: (res: any[]) => {
        console.log('====================================');
        console.log('CART API RESPONSE');
        console.log('====================================');

        console.log(res);

        try {
          // ---------------------------------------------
          // ENSURE RESPONSE IS ARRAY
          // ---------------------------------------------

          const cartData = Array.isArray(res) ? res : [];

          console.log('CART DATA:', cartData);

          // ---------------------------------------------
          // MAP CART ITEMS
          // ---------------------------------------------

          this.cartItems = cartData.map((item: any) => {
            // =========================================
            // PRICE
            // =========================================

            const price = Number(item?.price ?? 0);

            // =========================================
            // DISCOUNT
            // =========================================

            const discount = Number(item?.discount ?? 0);

            // =========================================
            // CART QUANTITY
            // =========================================

            const cartQuantity = Number(item?.cart_quantity ?? item?.quantity ?? 1);

            // =========================================
            // PRODUCT QUANTITY / PACK SIZE
            // =========================================

            const productQuantity = Number(
              item?.product_quantity ?? item?.quantity_per_pack ?? item?.productQuantity ?? 0,
            );

            // =========================================
            // DISCOUNTED PRICE
            // =========================================

            const calculatedDiscountedPrice = price - (price * discount) / 100;

            const discountedPrice = Number(item?.discountedPrice ?? calculatedDiscountedPrice);

            // =========================================
            // ITEM TOTAL
            // =========================================

            const itemTotal = discountedPrice * cartQuantity;

            // =========================================
            // UNIT
            // =========================================

            const unitOfMeasure = item?.unitOfMeasure ?? item?.unit_of_measure ?? 'piece';

            // =========================================
            // RETURN ITEM
            // =========================================

            return {
              ...item,

              // Cart quantity
              cart_quantity: cartQuantity,

              // Product / pack quantity
              product_quantity: productQuantity,

              // Product price
              price: price,

              // Discount percentage
              discount: discount,

              // Price after discount
              discountedPrice: Number(discountedPrice.toFixed(2)),

              // Total for this item
              itemTotal: Number(itemTotal.toFixed(2)),

              // Unit
              unitOfMeasure: unitOfMeasure,
            };
          });

          // ---------------------------------------------
          // FINAL CART
          // ---------------------------------------------

          console.log('FINAL CART ITEMS:', this.cartItems);

          // ---------------------------------------------
          // STOP LOADING
          // ---------------------------------------------

          this.isLoading = false;

          // ---------------------------------------------
          // IMPORTANT
          // FORCE UI UPDATE
          // ---------------------------------------------

          this.cdr.detectChanges();

          console.log('CART UI UPDATED');
        } catch (error) {
          // ---------------------------------------------
          // PROCESSING ERROR
          // ---------------------------------------------

          console.error('ERROR PROCESSING CART:', error);

          this.cartItems = [];

          this.isLoading = false;

          this.errorMessage = 'Unable to process your cart data.';

          this.cdr.detectChanges();
        }
      },

      // =================================================
      // API ERROR
      // =================================================

      error: (err: any) => {
        console.error('====================================');

        console.error('CART API ERROR:', err);

        console.error('====================================');

        this.cartItems = [];

        this.isLoading = false;

        this.errorMessage = 'Unable to load your cart.';

        // Force UI update
        this.cdr.detectChanges();
      },

      // =================================================
      // COMPLETE
      // =================================================

      complete: () => {
        console.log('CART API REQUEST COMPLETED');

        // Don't leave loader running
        this.isLoading = false;

        // Force UI update
        this.cdr.detectChanges();
      },
    });
  }

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(item: any): void {
    const currentQuantity = Number(item?.cart_quantity ?? 1);

    const newQuantity = currentQuantity + 1;

    console.log('Increasing quantity:', item.id, newQuantity);

    this.service.updateCart(item.id, newQuantity).subscribe({
      next: () => {
        console.log('Quantity updated successfully');

        this.loadCart();
      },

      error: (err) => {
        console.error('Unable to update cart:', err);
      },
    });
  }

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(item: any): void {
    const currentQuantity = Number(item?.cart_quantity ?? 1);

    // Don't allow quantity below 1
    if (currentQuantity <= 1) {
      return;
    }

    const newQuantity = currentQuantity - 1;

    console.log('Decreasing quantity:', item.id, newQuantity);

    this.service.updateCart(item.id, newQuantity).subscribe({
      next: () => {
        console.log('Quantity updated successfully');

        this.loadCart();
      },

      error: (err) => {
        console.error('Unable to update cart:', err);
      },
    });
  }

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(cartId: number): void {
    console.log('Removing cart item:', cartId);

    this.service.deleteCart(cartId).subscribe({
      next: () => {
        console.log('Cart item removed successfully');

        this.loadCart();
      },

      error: (err) => {
        console.error('Unable to remove cart item:', err);
      },
    });
  }

  // =====================================================
  // SUBTOTAL
  // =====================================================

  getSubtotal(): number {
    return this.cartItems.reduce((total: number, item: any) => {
      return total + Number(item?.itemTotal ?? 0);
    }, 0);
  }

  // =====================================================
  // TOTAL SAVINGS
  // =====================================================

  getTotalSavings(): number {
    return this.cartItems.reduce((total: number, item: any) => {
      const price = Number(item?.price ?? 0);

      const discountedPrice = Number(item?.discountedPrice ?? 0);

      const quantity = Number(item?.cart_quantity ?? 0);

      return total + (price - discountedPrice) * quantity;
    }, 0);
  }

  // =====================================================
  // TOTAL CART QUANTITY
  // =====================================================

  getTotalQuantity(): number {
    return this.cartItems.reduce((total: number, item: any) => {
      return total + Number(item?.cart_quantity ?? 0);
    }, 0);
  }
}
