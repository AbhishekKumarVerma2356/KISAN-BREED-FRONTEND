import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { Auth } from '../../../services/auth';
import { SiteData } from '../../../services/site-data';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrls: ['./site-header.css'],
})
export class SiteHeader implements OnInit {
  private authService = inject(Auth);
  private siteData = inject(SiteData);
  private router = inject(Router);

  mobileMenuOpen = false;

  // =========================================================
  // LOGIN STATUS
  // =========================================================

  isLoggedIn = false;

  // =========================================================
  // LOGOUT
  // =========================================================

  isLoggingOut = false;

  // =========================================================
  // CART COUNT
  // =========================================================

  cartCount = 0;

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    // -------------------------------------------------------
    // LOGIN STATUS
    // -------------------------------------------------------

    this.authService.loggedIn$.subscribe((status) => {
      this.isLoggedIn = status;

      console.log('Header login status:', status);

      if (status) {
        const userData = sessionStorage.getItem('user');

        if (userData) {
          try {
            const user = JSON.parse(userData);

            if (user?.id) {
              // Convert user ID to string
              this.siteData.loadCartCount(String(user.id));
            }
          } catch (error) {
            console.error('Invalid user session:', error);
          }
        }
      } else {
        // User logged out
        this.cartCount = 0;
      }
    });

    // -------------------------------------------------------
    // CART COUNT
    // -------------------------------------------------------

    this.siteData.cartCount$.subscribe((count) => {
      this.cartCount = count;

      console.log('Header cart count:', this.cartCount);
    });
  }

  // =========================================================
  // TOGGLE MOBILE MENU
  // =========================================================

  toggleMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // =========================================================
  // CLOSE MOBILE MENU
  // =========================================================

  closeMenu(): void {
    this.mobileMenuOpen = false;
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    console.log('Logging out...');

    this.authService.logout().subscribe({
      // =====================================================
      // SUCCESS
      // =====================================================

      next: (response) => {
        console.log('Logout API successful:', response);

        this.authService.clearSession();

        this.cartCount = 0;

        this.isLoggingOut = false;

        this.closeMenu();

        this.router.navigate(['/auth']);
      },

      // =====================================================
      // ERROR
      // =====================================================

      error: (error) => {
        console.error('Logout API error:', error);

        // Clear local session even if API fails
        this.authService.clearSession();

        this.cartCount = 0;

        this.isLoggingOut = false;

        this.closeMenu();

        this.router.navigate(['/auth']);
      },
    });
  }
}
