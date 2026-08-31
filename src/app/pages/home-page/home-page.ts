import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, Subscription } from 'rxjs';

import { SiteData } from '../../services/site-data';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
})
export class HomePage implements OnInit, OnDestroy {
  private service = inject(SiteData);
  private cdr = inject(ChangeDetectorRef);

  // =========================================================
  // CAROUSEL
  // =========================================================

  currentGalleryIndex = 0;

  private carouselTimer: ReturnType<typeof setInterval> | null = null;

  private gallerySubscription?: Subscription;

  // =========================================================
  // HOME DATA
  // =========================================================

  homeData$ = forkJoin({
    site: this.service.getSite(),
    products: this.service.getProducts(),
    testimonials: this.service.getTestimonials(),
    faqs: this.service.getFaqs(),
    gallery: this.service.getGallery(),
    certificates: this.service.getCertificates(),
  }).pipe(
    map((data: any) => {
      console.log('HOME API RESPONSE:', data);

      const gallery = this.getArray(data.gallery, 'gallery');

      // Start carousel after gallery data is available
      setTimeout(() => {
        this.startCarousel(gallery.length);
      });

      return {
        site: this.getObject(data.site),

        products: this.getArray(data.products, 'products'),

        testimonials: this.getArray(data.testimonials, 'testimonials'),

        faqs: this.getArray(data.faqs, 'faqs'),

        gallery: gallery,

        certificates: this.getArray(data.certificates, 'certificates'),

        isLoading: false,
      };
    }),

    catchError((error: unknown) => {
      console.error('Home page API error:', error);

      this.stopCarousel();

      return of({
        site: null,
        products: [],
        testimonials: [],
        faqs: [],
        gallery: [],
        certificates: [],
        isLoading: false,
      });
    }),
  );

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    // Subscribe once so the carousel can start after API data arrives
    this.gallerySubscription = this.homeData$.subscribe({
      next: (data) => {
        if (data.gallery.length > 1) {
          this.startCarousel(data.gallery.length);
        }
      },
      error: (error: unknown) => {
        console.error('Gallery subscription error:', error);
      },
    });
  }

  // =========================================================
  // START CAROUSEL
  // =========================================================

  private startCarousel(length: number): void {
    this.stopCarousel();

    if (length <= 1) {
      return;
    }

    this.carouselTimer = setInterval(() => {
      this.currentGalleryIndex = (this.currentGalleryIndex + 1) % length;

      // Force Angular to update the UI
      this.cdr.detectChanges();

      console.log('Carousel index:', this.currentGalleryIndex);
    }, 4000);
  }

  // =========================================================
  // NEXT
  // =========================================================

  nextGallery(length: number): void {
    if (!length) {
      return;
    }

    this.currentGalleryIndex = (this.currentGalleryIndex + 1) % length;

    this.restartCarousel(length);

    this.cdr.detectChanges();
  }

  // =========================================================
  // PREVIOUS
  // =========================================================

  previousGallery(length: number): void {
    if (!length) {
      return;
    }

    this.currentGalleryIndex = (this.currentGalleryIndex - 1 + length) % length;

    this.restartCarousel(length);

    this.cdr.detectChanges();
  }

  // =========================================================
  // GO TO SLIDE
  // =========================================================

  goToGallery(index: number, length: number): void {
    if (!length) {
      return;
    }

    this.currentGalleryIndex = index;

    this.restartCarousel(length);

    this.cdr.detectChanges();
  }

  // =========================================================
  // RESTART CAROUSEL
  // =========================================================

  private restartCarousel(length: number): void {
    this.stopCarousel();
    this.startCarousel(length);
  }

  // =========================================================
  // STOP CAROUSEL
  // =========================================================

  private stopCarousel(): void {
    if (this.carouselTimer !== null) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.stopCarousel();

    this.gallerySubscription?.unsubscribe();
  }

  // =========================================================
  // OBJECT HELPER
  // =========================================================

  private getObject(data: any): any {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return null;
    }

    return data;
  }

  // =========================================================
  // ARRAY HELPER
  // =========================================================

  private getArray(data: any, propertyName: string): any[] {
    // Backend directly returned an array
    if (Array.isArray(data)) {
      return data;
    }

    // Backend returned:
    // {
    //   "gallery": [...]
    // }

    if (data && Array.isArray(data[propertyName])) {
      return data[propertyName];
    }

    // Backend returned:
    // {
    //   "data": [...]
    // }

    if (data && Array.isArray(data.data)) {
      return data.data;
    }

    // Backend returned:
    // {
    //   "items": [...]
    // }

    if (data && Array.isArray(data.items)) {
      return data.items;
    }

    return [];
  }

  getRatingStars(rating: number | null | undefined): string[] {
    const value = Number(rating || 0);
    const roundedRating = Math.round(value);

    return Array.from({ length: 5 }, (_, index) => (index < roundedRating ? '★' : '☆'));
  }
}
