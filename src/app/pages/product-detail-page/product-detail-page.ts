import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { catchError, of, switchMap } from 'rxjs';

import { SiteData } from '../../services/site-data';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrls: ['./product-detail-page.css'],
})
export class ProductDetailPage implements OnInit {
  // =========================================================
  // SERVICES
  // =========================================================

  private service = inject(SiteData);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // =========================================================
  // PRODUCT
  // =========================================================

  product: any = null;

  currentProductId: number | null = null;

  pageLoading = true;

  // =========================================================
  // REVIEWS
  // =========================================================

  reviews: any[] = [];

  filteredReviews: any[] = [];

  reviewsLoading = false;

  reviewError = '';

  selectedRating: number | null = null;

  // =========================================================
  // REVIEW FORM
  // =========================================================

  showReviewForm = false;

  reviewRating = 0;

  reviewTitle = '';

  reviewContent = '';

  reviewSubmitting = false;

  reviewSuccess = '';

  reviewFormError = '';

  // =========================================================
  // REVIEW IMAGE
  // =========================================================

  reviewImageFile: File | null = null;

  reviewImagePreview: string | null = null;

  // =========================================================
  // IMAGE POPUP
  // =========================================================

  showImagePopup = false;

  selectedImageUrl = '';

  selectedImageAlt = '';

  selectedReview: any = null;

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadProduct();
  }

  // =========================================================
  // LOAD PRODUCT
  // =========================================================

  private loadProduct(): void {
    this.pageLoading = true;

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');

          console.log('PRODUCT SLUG:', slug);

          if (!slug) {
            return of(null);
          }

          return this.service.getProduct(slug);
        }),

        catchError((error) => {
          console.error('PRODUCT API ERROR:', error);

          this.product = null;
          this.currentProductId = null;

          this.reviews = [];
          this.filteredReviews = [];

          this.reviewsLoading = false;
          this.pageLoading = false;

          this.cdr.detectChanges();

          return of(null);
        }),
      )
      .subscribe({
        next: (product: any) => {
          console.log('=================================');
          console.log('PRODUCT API SUCCESS');
          console.log('PRODUCT:', product);
          console.log('=================================');

          this.product = product;

          if (product?.id !== null && product?.id !== undefined) {
            this.currentProductId = Number(product.id);

            console.log('CURRENT PRODUCT ID:', this.currentProductId);

            this.pageLoading = false;

            this.cdr.detectChanges();

            // Load reviews AFTER product has loaded
            this.loadReviews(this.currentProductId);
          } else {
            console.error('Product ID not found');

            this.currentProductId = null;

            this.reviews = [];
            this.filteredReviews = [];

            this.reviewsLoading = false;
            this.pageLoading = false;

            this.cdr.detectChanges();
          }
        },

        error: (error) => {
          console.error('PRODUCT LOADING FAILED:', error);

          this.product = null;
          this.currentProductId = null;

          this.reviews = [];
          this.filteredReviews = [];

          this.reviewsLoading = false;
          this.pageLoading = false;

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // LOAD REVIEWS
  // =========================================================

  loadReviews(productId: number): void {
    const id = Number(productId);

    console.log('=================================');
    console.log('LOAD REVIEWS CALLED');
    console.log('PRODUCT ID:', id);
    console.log('=================================');

    if (!Number.isFinite(id)) {
      console.error('INVALID PRODUCT ID:', productId);

      this.reviews = [];
      this.filteredReviews = [];

      this.reviewsLoading = false;

      this.reviewError = 'Invalid product ID.';

      this.cdr.detectChanges();

      return;
    }

    // IMPORTANT
    this.reviewsLoading = true;
    this.reviewError = '';

    this.currentProductId = id;

    // Clear previous reviews while loading
    this.reviews = [];
    this.filteredReviews = [];

    console.log('REVIEWS LOADING:', this.reviewsLoading);

    this.cdr.detectChanges();

    console.log('Calling getProductReviews()...');

    this.service.getProductReviews(id).subscribe({
      next: (response: any) => {
        console.log('=================================');
        console.log('REVIEWS API SUCCESS');
        console.log(response);
        console.log('=================================');

        // ---------------------------------------------
        // NORMALIZE RESPONSE
        // ---------------------------------------------

        if (Array.isArray(response)) {
          this.reviews = response;
        } else if (Array.isArray(response?.reviews)) {
          this.reviews = response.reviews;
        } else if (Array.isArray(response?.data)) {
          this.reviews = response.data;
        } else {
          this.reviews = [];
        }

        // ---------------------------------------------
        // FILTER
        // ---------------------------------------------

        this.applyReviewFilter();

        // ---------------------------------------------
        // STOP LOADING
        // ---------------------------------------------

        this.reviewsLoading = false;

        console.log('REVIEWS:', this.reviews);
        console.log('FILTERED REVIEWS:', this.filteredReviews);
        console.log('REVIEWS LOADING:', this.reviewsLoading);

        this.cdr.detectChanges();
      },

      error: (error: any) => {
        console.error('=================================');
        console.error('REVIEWS API ERROR');
        console.error(error);
        console.error('=================================');

        this.reviews = [];
        this.filteredReviews = [];

        this.reviewsLoading = false;

        this.reviewError =
          error?.error?.detail ||
          error?.error?.message ||
          error?.message ||
          'Unable to load reviews. Please try again.';

        console.log('REVIEWS LOADING:', this.reviewsLoading);

        this.cdr.detectChanges();
      },

      complete: () => {
        console.log('REVIEWS API COMPLETED');

        // Safety:
        // NEVER allow spinner to remain forever.
        this.reviewsLoading = false;

        this.cdr.detectChanges();
      },
    });
  }

  // =========================================================
  // APPLY REVIEW FILTER
  // =========================================================

  private applyReviewFilter(): void {
    if (this.selectedRating === null) {
      this.filteredReviews = [...this.reviews];

      return;
    }

    this.filteredReviews = this.reviews.filter(
      (review: any) => Number(review.rating) === this.selectedRating,
    );
  }

  // =========================================================
  // FILTER REVIEWS
  // =========================================================

  filterReviews(rating: number | null): void {
    this.selectedRating = rating;

    this.applyReviewFilter();
  }

  // =========================================================
  // WRITE REVIEW
  // =========================================================

  writeReview(product: any): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.router.url,
        },
      });

      return;
    }

    this.showReviewForm = true;

    this.reviewSuccess = '';
    this.reviewFormError = '';

    setTimeout(() => {
      const form = document.getElementById('review-form');

      if (form) {
        form.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }

  // =========================================================
  // CLOSE REVIEW FORM
  // =========================================================

  closeReviewForm(): void {
    this.showReviewForm = false;

    this.reviewSuccess = '';
    this.reviewFormError = '';
  }

  // =========================================================
  // LOGIN
  // =========================================================

  isLoggedIn(): boolean {
    const token =
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken');

    return !!token;
  }

  // =========================================================
  // RATING
  // =========================================================

  setReviewRating(rating: number): void {
    if (rating >= 1 && rating <= 5) {
      this.reviewRating = rating;
    }
  }

  // =========================================================
  // STARS
  // =========================================================

  getStars(count: number): number[] {
    return Array.from(
      {
        length: count,
      },
      (_, index) => index + 1,
    );
  }

  isStarActive(rating: number, star: number): boolean {
    return Number(rating) >= star;
  }

  // =========================================================
  // REVIEW IMAGE SELECT
  // =========================================================

  onReviewImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.reviewFormError = 'Please upload JPG, PNG or WEBP image only.';

      input.value = '';

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.reviewFormError = 'Image size must be less than 5 MB.';

      input.value = '';

      return;
    }

    this.reviewImageFile = file;

    this.reviewFormError = '';

    const reader = new FileReader();

    reader.onload = () => {
      this.reviewImagePreview = reader.result as string;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // =========================================================
  // REMOVE REVIEW IMAGE
  // =========================================================

  removeReviewImage(): void {
    this.reviewImageFile = null;
    this.reviewImagePreview = null;
  }

  // =========================================================
  // SUBMIT REVIEW
  // =========================================================

  submitReview(product: any): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.router.url,
        },
      });

      return;
    }

    const productId = Number(product?.id);

    if (!Number.isFinite(productId)) {
      this.reviewFormError = 'Invalid product ID.';

      return;
    }

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewFormError = 'Please select a rating from 1 to 5 stars.';

      return;
    }

    if (!this.reviewTitle.trim()) {
      this.reviewFormError = 'Please enter a review title.';

      return;
    }

    if (!this.reviewContent.trim()) {
      this.reviewFormError = 'Please enter your review.';

      return;
    }

    this.reviewSubmitting = true;

    this.reviewFormError = '';
    this.reviewSuccess = '';

    this.service
      .addReview(
        productId,
        this.reviewRating,
        this.reviewTitle.trim(),
        this.reviewContent.trim(),
        this.reviewImageFile || undefined,
      )
      .subscribe({
        next: (response: any) => {
          console.log('REVIEW CREATED:', response);

          this.reviewSubmitting = false;

          this.reviewSuccess = 'Your review has been submitted successfully.';

          this.reviewRating = 0;
          this.reviewTitle = '';
          this.reviewContent = '';

          this.removeReviewImage();

          // Reload reviews
          this.loadReviews(productId);

          setTimeout(() => {
            this.showReviewForm = false;
            this.reviewSuccess = '';
          }, 2500);

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error('REVIEW SUBMISSION FAILED:', error);

          this.reviewSubmitting = false;

          if (error?.status === 401) {
            this.router.navigate(['/login'], {
              queryParams: {
                returnUrl: this.router.url,
              },
            });

            return;
          }

          this.reviewFormError =
            error?.error?.detail ||
            error?.error?.message ||
            'Unable to submit your review. Please try again.';

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // REVIEWER NAME
  // =========================================================

  getReviewerName(review: any): string {
    return (
      review?.user_name ||
      review?.username ||
      review?.user?.name ||
      review?.user?.username ||
      review?.customer_name ||
      'Customer'
    );
  }

  // =========================================================
  // REVIEW DATE
  // =========================================================

  formatReviewDate(date: any): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // =========================================================
  // IMAGE URL NORMALIZER
  // =========================================================

  normalizeImageUrl(image: string | null | undefined): string {
    if (!image || typeof image !== 'string') {
      return '';
    }

    let value = image.trim();

    if (!value) {
      return '';
    }

    // Full URL
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('data:') ||
      value.startsWith('blob:')
    ) {
      return value;
    }

    // Angular assets
    if (value.startsWith('/assets/')) {
      return value;
    }

    if (value.startsWith('assets/')) {
      return `/${value}`;
    }

    // Backend absolute path
    if (value.startsWith('/')) {
      return `http://localhost:8000${value}`;
    }

    // Backend relative path
    return `http://localhost:8000/${value}`;
  }

  // =========================================================
  // CUSTOMER REVIEW IMAGE
  // =========================================================

  getReviewImage(review: any): string | null {
    const image = review?.image || review?.image_url || review?.review_image;

    if (!image || typeof image !== 'string') {
      return null;
    }

    return this.normalizeImageUrl(image);
  }

  // =========================================================
  // PRODUCT IMAGE INSIDE REVIEW
  // =========================================================

  getReviewProductImage(review: any): string | null {
    if (!review) {
      return null;
    }

    // Product image ONLY
    const image =
      review?.product?.image ||
      review?.product?.image_url ||
      review?.product?.product_image ||
      review?.product?.image_path ||
      review?.product_image ||
      review?.product_image_url ||
      null;

    if (!image || typeof image !== 'string') {
      return null;
    }

    return this.normalizeImageUrl(image);
  }

  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img) {
      img.style.display = 'none';
    }
  }

  // =========================================================
  // OPEN IMAGE POPUP
  // =========================================================

  openImagePopup(imageUrl: string, review: any): void {
    this.selectedImageUrl = this.normalizeImageUrl(imageUrl);

    this.selectedImageAlt = review?.title || 'Customer review image';

    this.selectedReview = review;

    this.showImagePopup = true;

    document.body.style.overflow = 'hidden';
  }

  // =========================================================
  // CLOSE IMAGE POPUP
  // =========================================================

  closeImagePopup(): void {
    this.showImagePopup = false;

    this.selectedImageUrl = '';
    this.selectedImageAlt = '';
    this.selectedReview = null;

    document.body.style.overflow = '';
  }

  // =========================================================
  // CART
  // =========================================================

  addToCart(product: any): void {
    const userData = sessionStorage.getItem('user');

    // User must be logged in
    if (!userData) {
      this.router.navigate(['/auth'], {
        queryParams: {
          returnUrl: this.router.url,
        },
      });
      return;
    }

    let user: any;

    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error('Invalid user session:', error);
      this.router.navigate(['/auth']);
      return;
    }

    const userId = String(user?.id);

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('User ID not found');
      return;
    }

    const productId = Number(product?.id);

    if (!Number.isFinite(productId)) {
      console.error('Invalid product ID:', product?.id);
      return;
    }

    console.log('=================================');
    console.log('ADD TO CART');
    console.log('USER ID:', userId);
    console.log('PRODUCT ID:', productId);
    console.log('PRODUCT:', product);
    console.log('=================================');

    // First check user's existing cart
    this.service.getCart(userId).subscribe({
      next: (cart: any[]) => {
        const existingItem = (cart || []).find(
          (item: any) => Number(item.product_id ?? item.product?.id ?? item.id) === productId,
        );

        if (existingItem) {
          // Product already exists → increase quantity
          const currentQuantity = Number(existingItem.cart_quantity ?? existingItem.quantity ?? 1);

          const newQuantity = currentQuantity + 1;

          console.log('Existing cart item found');
          console.log('Cart ID:', existingItem.id);
          console.log('New quantity:', newQuantity);

          this.service.updateCart(existingItem.id, newQuantity).subscribe({
            next: (response: any) => {
              console.log('CART QUANTITY UPDATED:', response);
              alert(`${product.name} quantity updated`);
            },
            error: (error: any) => {
              console.error('UPDATE CART ERROR:', error);
            },
          });
        } else {
          // Product does not exist → create cart item
          console.log('Adding new product to cart');

          this.service.addToCart(userId, productId, 1).subscribe({
            next: (response: any) => {
              console.log('PRODUCT ADDED TO CART:', response);
              alert(`${product.name} added to cart`);
            },
            error: (error: any) => {
              console.error('ADD TO CART ERROR:', error);
            },
          });
        }
      },

      error: (error: any) => {
        console.error('GET CART ERROR:', error);
      },
    });
  }

  // =========================================================
  // BUY NOW
  // =========================================================

  buyNow(product: any): void {
    const userData = sessionStorage.getItem('user');

    if (!userData) {
      this.router.navigate(['/auth'], {
        queryParams: {
          returnUrl: this.router.url,
        },
      });
      return;
    }

    this.addToCart(product);

    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 500);
  }
}
