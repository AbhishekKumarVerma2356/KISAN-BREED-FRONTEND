import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, map, of } from 'rxjs';

import { SiteData } from '../../services/site-data';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-page.html',
  styleUrls: ['./contact-page.css'],
})
export class ContactPage {
  private service = inject(SiteData);
  private cdr = inject(ChangeDetectorRef);

  // =========================
  // FORM FIELDS
  // =========================

  name = '';
  phone = '';
  email = '';
  message = '';

  // =========================
  // UI STATE
  // =========================

  isSubmitting = false;

  successMessage = '';
  errorMessage = '';

  // =========================
  // PAGE DATA
  // =========================

  pageData$ = this.service.getSite().pipe(
    map((site: any) => ({
      site: site ?? null,
      isLoading: false,
    })),

    catchError((error) => {
      console.error('Contact page load error:', error);

      return of({
        site: null,
        isLoading: false,
      });
    }),
  );

  // =========================
  // SUBMIT FORM
  // =========================

  submitForm(): void {
    console.log('Submit clicked');

    if (this.isSubmitting) {
      return;
    }

    // Clear messages
    this.successMessage = '';
    this.errorMessage = '';

    // =========================
    // GET VALUES
    // =========================

    const name = this.name.trim();
    const phone = this.phone.trim();
    const email = this.email.trim();
    const message = this.message.trim();

    // =========================
    // VALIDATION
    // =========================

    if (!name) {
      this.errorMessage = 'Please enter your name.';
      this.cdr.detectChanges();
      return;
    }

    if (name.length < 2) {
      this.errorMessage = 'Name must contain at least 2 characters.';
      this.cdr.detectChanges();
      return;
    }

    if (!phone) {
      this.errorMessage = 'Please enter your phone number.';
      this.cdr.detectChanges();
      return;
    }

    if (!/^[0-9]{10,15}$/.test(phone)) {
      this.errorMessage = 'Please enter a valid phone number.';
      this.cdr.detectChanges();
      return;
    }

    if (!email) {
      this.errorMessage = 'Please enter your email.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      this.cdr.detectChanges();
      return;
    }

    if (!message) {
      this.errorMessage = 'Please enter your message.';
      this.cdr.detectChanges();
      return;
    }

    if (message.length < 5) {
      this.errorMessage = 'Message must contain at least 5 characters.';
      this.cdr.detectChanges();
      return;
    }

    // =========================
    // START SUBMITTING
    // =========================

    this.isSubmitting = true;

    // Immediately update UI
    this.cdr.detectChanges();

    // =========================
    // REQUEST
    // =========================

    const requestData = {
      name,
      phone,
      email,
      message,
    };

    console.log('Sending contact request:', requestData);

    // =========================
    // API
    // =========================

    this.service.submitContact(requestData).subscribe({
      // =========================
      // SUCCESS
      // =========================

      next: (response: any) => {
        console.log('Contact API SUCCESS:', response);

        this.isSubmitting = false;

        this.successMessage = response?.message || 'Your message has been submitted successfully.';

        this.errorMessage = '';

        // Clear form
        this.name = '';
        this.phone = '';
        this.email = '';
        this.message = '';

        // IMPORTANT
        // Force Angular UI update
        this.cdr.detectChanges();

        console.log('isSubmitting:', this.isSubmitting);
      },

      // =========================
      // ERROR
      // =========================

      error: (error: any) => {
        console.error('Contact API ERROR:', error);

        this.isSubmitting = false;

        this.successMessage = '';

        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Unable to submit your message. Please try again.';

        // IMPORTANT
        this.cdr.detectChanges();
      },

      // =========================
      // COMPLETE
      // =========================

      complete: () => {
        console.log('Contact request completed');

        this.isSubmitting = false;

        // IMPORTANT
        this.cdr.detectChanges();
      },
    });
  }

  // =========================
  // EMAIL VALIDATION
  // =========================

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
