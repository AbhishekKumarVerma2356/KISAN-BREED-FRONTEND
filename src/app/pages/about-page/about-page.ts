import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { SiteData } from '../../services/site-data';

type PolicyType = 'shipping' | 'privacy' | 'terms' | 'refund' | null;

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.html',
  styleUrls: ['./about-page.css'],
})
export class AboutPage {
  private service = inject(SiteData);

  // =========================================================
  // PAGE DATA
  // =========================================================

  pageData$ = this.service.getSite().pipe(
    map((site: any) => ({
      site: site ?? null,
    })),

    catchError((error) => {
      console.error('About page load error:', error);

      return of({
        site: null,
      });
    }),
  );

  // =========================================================
  // POLICY MODAL
  // =========================================================

  selectedPolicy: PolicyType = null;

  // =========================================================
  // OPEN POLICY
  // =========================================================

  openPolicy(policy: PolicyType): void {
    if (!policy) {
      return;
    }

    this.selectedPolicy = policy;

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  }

  // =========================================================
  // CLOSE POLICY
  // =========================================================

  closePolicy(): void {
    this.selectedPolicy = null;

    // Restore background scrolling
    document.body.style.overflow = '';
  }

  // =========================================================
  // CLOSE MODAL WHEN CLICKING BACKDROP
  // =========================================================

  closePolicyFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePolicy();
    }
  }
}
