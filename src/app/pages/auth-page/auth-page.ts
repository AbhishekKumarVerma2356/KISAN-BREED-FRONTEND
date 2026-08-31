import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  NgZone,
  ViewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-page.html',
})
export class AuthPage implements AfterViewInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // =========================================================
  // VIEW REFERENCES
  // =========================================================

  @ViewChild('forgotEmailInput')
  forgotEmailInput?: ElementRef<HTMLInputElement>;

  @ViewChild('forgotOtpInput')
  forgotOtpInput?: ElementRef<HTMLInputElement>;

  @ViewChild('newPasswordInput')
  newPasswordInput?: ElementRef<HTMLInputElement>;

  // =========================================================
  // ACTIVE TAB
  // =========================================================

  activeTab: 'login' | 'signup' | 'forgot' = 'login';

  // =========================================================
  // LOGIN
  // =========================================================

  loading = false;

  errorMessage = '';
  successMessage = '';

  loginData = {
    email: '',
    password: '',
  };

  // =========================================================
  // SIGNUP
  // =========================================================

  signupData = {
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    addressType: 'home',
    flatHouseNo: '',
    address1: '',
    address2: '',
    state: '',
    cityVillage: '',
    pincode: '',
    password: '',
    confirmPassword: '',
  };

  // =========================================================
  // STATES
  // =========================================================

  states: string[] = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  forgotStep: 1 | 2 | 3 = 1;

  forgotEmail = '';
  forgotOtp = '';
  newPassword = '';
  confirmNewPassword = '';

  forgotLoading = false;
  forgotError = '';
  forgotSuccess = '';

  // =========================================================
  // AFTER VIEW INIT
  // =========================================================

  ngAfterViewInit(): void {
    // Nothing required here.
  }

  // =========================================================
  // SWITCH TAB
  // =========================================================

  switchTab(tab: 'login' | 'signup' | 'forgot'): void {
    console.log('Switching tab:', tab);

    // Update immediately
    this.activeTab = tab;

    // Clear normal messages
    this.clearMessages();

    // Clear forgot messages
    this.forgotError = '';
    this.forgotSuccess = '';

    // Reset forgot-password flow
    if (tab === 'forgot') {
      this.resetForgotPassword();

      // Force Angular to render the new @if block
      this.cdr.detectChanges();

      // Focus email after Angular renders it
      this.focusForgotEmail();

      return;
    }

    // Update UI immediately
    this.cdr.detectChanges();
  }

  // =========================================================
  // FOCUS FORGOT EMAIL
  // =========================================================

  focusForgotEmail(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.forgotEmailInput?.nativeElement.focus();
        });
      });
    });
  }

  // =========================================================
  // FOCUS OTP
  // =========================================================

  private focusForgotOtp(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.forgotOtpInput?.nativeElement.focus();
        });
      });
    });
  }

  // =========================================================
  // FOCUS NEW PASSWORD
  // =========================================================

  private focusNewPassword(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.newPasswordInput?.nativeElement.focus();
        });
      });
    });
  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(): void {
    this.clearMessages();

    const email = this.loginData.email.trim();
    const password = this.loginData.password;

    if (!email || !password) {
      this.errorMessage = 'Please enter your email and password.';

      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Please enter a valid email address.';

      return;
    }

    this.loading = true;

    this.auth
      .login({
        email,
        password,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;

          console.log('Login successful:', response);

          this.router.navigate(['/']);
        },

        error: (error) => {
          this.loading = false;

          console.error('Login error:', error);

          this.errorMessage =
            error?.error?.detail || error?.error?.message || 'Invalid email or password.';
        },
      });
  }

  // =========================================================
  // SIGNUP
  // =========================================================

  signup(): void {
    this.clearMessages();

    const data = this.signupData;

    if (
      !data.name.trim() ||
      !data.email.trim() ||
      !data.phone.trim() ||
      !data.flatHouseNo.trim() ||
      !data.address1.trim() ||
      !data.state ||
      !data.cityVillage.trim() ||
      !data.pincode.trim() ||
      !data.password
    ) {
      this.errorMessage = 'Please fill all required fields.';

      return;
    }

    if (!this.isValidEmail(data.email.trim())) {
      this.errorMessage = 'Please enter a valid email address.';

      return;
    }

    if (!/^\d{10}$/.test(data.phone.trim())) {
      this.errorMessage = 'Phone number must contain exactly 10 digits.';

      return;
    }

    if (data.alternatePhone && !/^\d{10}$/.test(data.alternatePhone.trim())) {
      this.errorMessage = 'Alternate phone number must contain exactly 10 digits.';

      return;
    }

    if (!/^\d{6}$/.test(data.pincode.trim())) {
      this.errorMessage = 'Pincode must contain exactly 6 digits.';

      return;
    }

    if (data.password.length < 6) {
      this.errorMessage = 'Password must contain at least 6 characters.';

      return;
    }

    if (data.password !== data.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';

      return;
    }

    const payload = {
      full_name: data.name.trim(),

      email: data.email.trim(),

      contact_number: data.phone.trim(),

      alternate_contact_number: data.alternatePhone.trim() || null,

      password: data.password,

      address: {
        address_type: data.addressType,

        flat_house_no: data.flatHouseNo.trim(),

        address1: data.address1.trim(),

        address2: data.address2.trim() || null,

        state: data.state,

        city_village: data.cityVillage.trim(),

        pincode: data.pincode.trim(),
      },
    };

    this.loading = true;

    this.auth.signup(payload).subscribe({
      next: (response) => {
        this.loading = false;

        console.log('Signup successful:', response);

        this.successMessage = 'Account created successfully. Please login.';

        this.activeTab = 'login';

        this.loginData.email = data.email.trim();

        this.signupData.password = '';
        this.signupData.confirmPassword = '';

        this.cdr.detectChanges();
      },

      error: (error) => {
        this.loading = false;

        console.error('Signup error:', error);

        this.errorMessage =
          error?.error?.detail || error?.error?.message || 'Unable to create account.';
      },
    });
  }

  // =========================================================
  // SEND FORGOT PASSWORD CODE
  // =========================================================

  sendForgotPasswordCode(): void {
    this.forgotError = '';
    this.forgotSuccess = '';

    const email = this.forgotEmail.trim();

    if (!email) {
      this.forgotError = 'Please enter your email address.';

      return;
    }

    if (!this.isValidEmail(email)) {
      this.forgotError = 'Please enter a valid email address.';

      return;
    }

    this.forgotLoading = true;

    this.auth.forgotPassword(email).subscribe({
      next: (response) => {
        this.forgotLoading = false;

        console.log('Forgot password response:', response);

        this.forgotStep = 2;

        this.forgotSuccess = 'A 6-digit verification code has been sent to your email address.';

        // Render STEP 2 immediately
        this.cdr.detectChanges();

        // Focus OTP input
        this.focusForgotOtp();
      },

      error: (error) => {
        this.forgotLoading = false;

        console.error('Forgot password error:', error);

        this.forgotError =
          error?.error?.detail || error?.error?.message || 'Unable to send verification code.';
      },
    });
  }

  // =========================================================
  // VERIFY OTP
  // =========================================================

  verifyForgotPasswordCode(): void {
    this.forgotError = '';
    this.forgotSuccess = '';

    const email = this.forgotEmail.trim();

    const otp = this.forgotOtp.trim();

    if (!email) {
      this.forgotError = 'Email address is required.';

      return;
    }

    if (!otp) {
      this.forgotError = 'Please enter the verification code.';

      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      this.forgotError = 'Verification code must contain 6 digits.';

      return;
    }

    this.forgotLoading = true;

    this.auth.verifyForgotPasswordOTP(email, otp).subscribe({
      next: (response) => {
        this.forgotLoading = false;

        console.log('OTP verified:', response);

        this.forgotStep = 3;

        this.forgotSuccess = 'Verification successful. You can now create a new password.';

        // Render STEP 3 immediately
        this.cdr.detectChanges();

        // Focus password
        this.focusNewPassword();
      },

      error: (error) => {
        this.forgotLoading = false;

        console.error('OTP verification error:', error);

        this.forgotError =
          error?.error?.detail || error?.error?.message || 'Invalid or expired verification code.';
      },
    });
  }

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  resetPassword(): void {
    this.forgotError = '';
    this.forgotSuccess = '';

    const email = this.forgotEmail.trim();

    const otp = this.forgotOtp.trim();

    if (!email) {
      this.forgotError = 'Email address is missing.';

      return;
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      this.forgotError = 'Invalid verification code.';

      return;
    }

    if (!this.newPassword || !this.confirmNewPassword) {
      this.forgotError = 'Please enter and confirm your new password.';

      return;
    }

    if (this.newPassword.length < 6) {
      this.forgotError = 'New password must contain at least 6 characters.';

      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.forgotError = 'Passwords do not match.';

      return;
    }

    this.forgotLoading = true;

    this.auth.resetForgottenPassword(email, otp, this.newPassword).subscribe({
      next: (response) => {
        this.forgotLoading = false;

        console.log('Password reset successful:', response);

        this.forgotSuccess = 'Password changed successfully. You can now login.';

        this.loginData.email = email;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.activeTab = 'login';

          this.forgotStep = 1;

          this.forgotEmail = '';
          this.forgotOtp = '';

          this.newPassword = '';
          this.confirmNewPassword = '';

          this.forgotSuccess = '';
          this.forgotError = '';

          this.cdr.detectChanges();
        }, 1800);
      },

      error: (error) => {
        this.forgotLoading = false;

        console.error('Reset password error:', error);

        this.forgotError =
          error?.error?.detail || error?.error?.message || 'Unable to reset password.';
      },
    });
  }

  // =========================================================
  // RESET FORGOT PASSWORD
  // =========================================================

  resetForgotPassword(): void {
    this.forgotStep = 1;

    this.forgotEmail = '';
    this.forgotOtp = '';

    this.newPassword = '';
    this.confirmNewPassword = '';

    this.forgotError = '';
    this.forgotSuccess = '';

    this.forgotLoading = false;
  }

  // =========================================================
  // BACK TO LOGIN
  // =========================================================

  backToLogin(): void {
    this.activeTab = 'login';

    this.forgotError = '';
    this.forgotSuccess = '';

    this.forgotLoading = false;

    this.cdr.detectChanges();
  }

  // =========================================================
  // VALIDATE EMAIL
  // =========================================================

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
