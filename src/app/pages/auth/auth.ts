import { Component, ChangeDetectorRef, NgZone, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
})
export class AuthComponent implements OnDestroy {
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  // =========================================================
  // AUTH MODE
  // =========================================================

  mode: 'login' | 'signup' | 'forgot' = 'login';

  // =========================================================
  // LOGIN
  // =========================================================

  loginEmail = '';
  loginPassword = '';

  showLoginPassword = false;

  isLoggingIn = false;

  loginError = '';

  // =========================================================
  // SIGNUP
  // =========================================================

  signupName = '';
  signupEmail = '';
  signupPhone = '';
  signupPassword = '';

  showSignupPassword = false;

  isSigningUp = false;

  signupError = '';

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  forgotStep: 1 | 2 | 3 = 1;

  forgotEmail = '';
  forgotOtp = '';

  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  isSendingOtp = false;
  isVerifyingOtp = false;
  isResettingPassword = false;

  forgotError = '';
  forgotSuccess = '';

  // =========================================================
  // OTP TIMER
  // =========================================================

  resendCountdown = 0;

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  // =========================================================
  // SWITCH TO LOGIN
  // =========================================================

  showLogin(): void {
    this.mode = 'login';

    this.clearMessages();
    this.clearForgotPasswordState();

    this.refreshView();
  }

  // =========================================================
  // SWITCH TO SIGNUP
  // =========================================================

  showSignup(): void {
    this.mode = 'signup';

    this.clearMessages();
    this.clearForgotPasswordState();

    this.refreshView();
  }

  // =========================================================
  // SWITCH TO FORGOT PASSWORD
  // =========================================================

  showForgotPassword(): void {
    this.mode = 'forgot';

    this.clearMessages();

    this.forgotStep = 1;

    this.forgotEmail = '';
    this.forgotOtp = '';

    this.newPassword = '';
    this.confirmPassword = '';

    this.isSendingOtp = false;
    this.isVerifyingOtp = false;
    this.isResettingPassword = false;

    this.stopResendTimer();

    this.refreshView();
  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(): void {
    this.loginError = '';

    const email = this.loginEmail.trim();

    if (!email) {
      this.loginError = 'Please enter your email address.';
      return;
    }

    if (!this.loginPassword) {
      this.loginError = 'Please enter your password.';
      return;
    }

    this.isLoggingIn = true;

    this.auth
      .login({
        email,
        password: this.loginPassword,
      })
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isLoggingIn = false;
            this.refreshView();
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.zone.run(() => {
            console.log('LOGIN SUCCESS:', response);

            this.isLoggingIn = false;
            this.refreshView();

            window.location.href = '/';
          });
        },

        error: (error) => {
          this.zone.run(() => {
            console.error('LOGIN ERROR:', error);

            this.isLoggingIn = false;

            this.loginError =
              error?.error?.detail ||
              error?.error?.message ||
              'Invalid email or password. Please try again.';

            this.refreshView();
          });
        },
      });
  }

  // =========================================================
  // SIGNUP
  // =========================================================

  signup(): void {
    this.signupError = '';

    const name = this.signupName.trim();
    const email = this.signupEmail.trim();
    const phone = this.signupPhone.trim();

    if (!name) {
      this.signupError = 'Please enter your full name.';
      return;
    }

    if (!email) {
      this.signupError = 'Please enter your email address.';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.signupError = 'Please enter a valid email address.';
      return;
    }

    if (!phone) {
      this.signupError = 'Please enter your contact number.';
      return;
    }

    if (!this.signupPassword) {
      this.signupError = 'Please enter a password.';
      return;
    }

    if (this.signupPassword.length < 6) {
      this.signupError = 'Password must contain at least 6 characters.';
      return;
    }

    this.isSigningUp = true;

    this.auth
      .signup({
        full_name: name,
        email,
        contact_number: phone,
        password: this.signupPassword,
      })
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isSigningUp = false;
            this.refreshView();
          });
        }),
      )
      .subscribe({
        next: (response) => {
          this.zone.run(() => {
            console.log('SIGNUP SUCCESS:', response);

            this.isSigningUp = false;

            this.mode = 'login';

            this.loginEmail = email;

            this.signupName = '';
            this.signupEmail = '';
            this.signupPhone = '';
            this.signupPassword = '';

            this.loginError = 'Account created successfully. Please login.';

            this.refreshView();
          });
        },

        error: (error) => {
          this.zone.run(() => {
            console.error('SIGNUP ERROR:', error);

            this.isSigningUp = false;

            this.signupError =
              error?.error?.detail ||
              error?.error?.message ||
              'Unable to create account. Please try again.';

            this.refreshView();
          });
        },
      });
  }

  // =========================================================
  // FORGOT PASSWORD - STEP 1
  // SEND OTP
  // =========================================================

  sendForgotPasswordOtp(): void {
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

    this.isSendingOtp = true;

    console.log('STEP 1 - Sending OTP');
    console.log('Email:', email);

    this.auth.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          console.log('FORGOT PASSWORD SUCCESS:', response);

          this.isSendingOtp = false;

          this.forgotEmail = email;

          this.forgotOtp = '';

          // ================================================
          // IMPORTANT
          // Move from Step 1 -> Step 2
          // ================================================

          this.forgotStep = 2;

          this.forgotSuccess =
            response?.message || 'A 6-digit verification code has been sent to your email.';

          this.forgotError = '';

          this.startResendTimer();

          // ================================================
          // IMPORTANT
          // Force Angular to check this component
          // ================================================

          this.refreshView();

          console.log('Current forgotStep:', this.forgotStep);
        });
      },

      error: (error: any) => {
        this.zone.run(() => {
          console.error('FORGOT PASSWORD ERROR:', error);

          this.isSendingOtp = false;

          this.forgotError =
            error?.error?.detail ||
            error?.error?.message ||
            'Unable to send verification code. Please try again.';

          this.refreshView();
        });
      },

      complete: () => {
        this.zone.run(() => {
          this.isSendingOtp = false;

          this.refreshView();
        });
      },
    });
  }

  // =========================================================
  // STEP 2 - VERIFY OTP
  // =========================================================

  verifyForgotPasswordOtp(): void {
    this.forgotError = '';
    this.forgotSuccess = '';

    const otp = this.forgotOtp.trim();

    if (!otp) {
      this.forgotError = 'Please enter the verification code.';
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      this.forgotError = 'Verification code must contain exactly 6 digits.';
      return;
    }

    this.isVerifyingOtp = true;

    console.log('VERIFY OTP:', otp);

    this.auth.verifyForgotPasswordOTP(this.forgotEmail.trim(), otp).subscribe({
      next: (response: any) => {
        this.zone.run(() => {
          console.log('OTP verification response:', response);

          this.isVerifyingOtp = false;

          // ================================================
          // IMPORTANT
          // Move from Step 2 -> Step 3
          // ================================================

          this.forgotStep = 3;

          this.forgotSuccess =
            response?.message || 'Verification successful. You can now create a new password.';

          this.forgotError = '';

          this.stopResendTimer();

          // ================================================
          // Force view update
          // ================================================

          this.refreshView();

          console.log('Current forgotStep:', this.forgotStep);
        });
      },

      error: (error: any) => {
        this.zone.run(() => {
          console.error('OTP verification error:', error);

          this.isVerifyingOtp = false;

          this.forgotError =
            error?.error?.detail ||
            error?.error?.message ||
            'Invalid or expired verification code. Please try again.';

          this.refreshView();
        });
      },

      complete: () => {
        this.zone.run(() => {
          this.isVerifyingOtp = false;

          this.refreshView();
        });
      },
    });
  }

  // =========================================================
  // STEP 3 - RESET PASSWORD
  // =========================================================

  resetForgottenPassword(): void {
    this.forgotError = '';
    this.forgotSuccess = '';

    if (!this.newPassword) {
      this.forgotError = 'Please enter your new password.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.forgotError = 'Password must contain at least 6 characters.';
      return;
    }

    if (!this.confirmPassword) {
      this.forgotError = 'Please confirm your new password.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.forgotError = 'Passwords do not match.';
      return;
    }

    this.isResettingPassword = true;

    this.auth
      .resetForgottenPassword(this.forgotEmail.trim(), this.forgotOtp.trim(), this.newPassword)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isResettingPassword = false;
            this.refreshView();
          });
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.zone.run(() => {
            console.log('PASSWORD RESET SUCCESS:', response);

            this.isResettingPassword = false;

            this.forgotSuccess =
              response?.message || 'Password changed successfully. You can now login.';

            this.forgotError = '';

            this.newPassword = '';
            this.confirmPassword = '';

            this.refreshView();

            setTimeout(() => {
              this.zone.run(() => {
                const email = this.forgotEmail;

                this.clearForgotPasswordState();

                this.mode = 'login';

                this.loginEmail = email;

                this.loginPassword = '';

                this.loginError = 'Password changed successfully. Please login.';

                this.refreshView();
              });
            }, 1800);
          });
        },

        error: (error: any) => {
          this.zone.run(() => {
            console.error('PASSWORD RESET ERROR:', error);

            this.isResettingPassword = false;

            this.forgotError =
              error?.error?.detail ||
              error?.error?.message ||
              'Unable to reset password. Please try again.';

            this.refreshView();
          });
        },

        complete: () => {
          this.zone.run(() => {
            this.isResettingPassword = false;

            this.refreshView();
          });
        },
      });
  }

  // =========================================================
  // RESEND OTP
  // =========================================================

  resendOtp(): void {
    if (this.resendCountdown > 0 || this.isSendingOtp) {
      return;
    }

    const email = this.forgotEmail.trim();

    if (!email) {
      this.forgotError = 'Email address is missing.';
      return;
    }

    this.forgotError = '';
    this.forgotSuccess = '';

    this.isSendingOtp = true;

    this.auth
      .forgotPassword(email)
      .pipe(
        finalize(() => {
          this.zone.run(() => {
            this.isSendingOtp = false;
            this.refreshView();
          });
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.zone.run(() => {
            console.log('RESEND OTP SUCCESS:', response);

            this.isSendingOtp = false;

            let message = 'A new verification code has been sent to your email.';

            if (typeof response === 'string') {
              try {
                const parsed = JSON.parse(response);

                if (parsed?.message) {
                  message = parsed.message;
                }
              } catch {
                // Normal text response
              }
            } else if (response?.message) {
              message = response.message;
            }

            this.forgotSuccess = message;

            this.forgotError = '';

            this.startResendTimer();

            this.refreshView();
          });
        },

        error: (error: any) => {
          this.zone.run(() => {
            console.error('RESEND OTP ERROR:', error);

            this.isSendingOtp = false;

            this.forgotError =
              error?.error?.detail ||
              error?.error?.message ||
              'Unable to resend verification code.';

            this.refreshView();
          });
        },
      });
  }

  // =========================================================
  // OTP INPUT
  // =========================================================

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/\D/g, '').slice(0, 6);

    this.forgotOtp = input.value;
  }

  // =========================================================
  // OTP TIMER
  // =========================================================

  private startResendTimer(): void {
    this.stopResendTimer();

    this.resendCountdown = 60;

    this.refreshView();

    this.resendTimer = setInterval(() => {
      this.zone.run(() => {
        if (this.resendCountdown > 0) {
          this.resendCountdown--;

          this.refreshView();
        } else {
          this.stopResendTimer();

          this.refreshView();
        }
      });
    }, 1000);
  }

  // =========================================================
  // STOP TIMER
  // =========================================================

  private stopResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }

    this.resendCountdown = 0;
  }

  // =========================================================
  // BACK TO EMAIL
  // =========================================================

  backToForgotEmail(): void {
    this.forgotStep = 1;

    this.forgotOtp = '';

    this.forgotError = '';
    this.forgotSuccess = '';

    this.stopResendTimer();

    this.refreshView();
  }

  // =========================================================
  // CLEAR FORGOT PASSWORD STATE
  // =========================================================

  private clearForgotPasswordState(): void {
    this.forgotStep = 1;

    this.forgotEmail = '';
    this.forgotOtp = '';

    this.newPassword = '';
    this.confirmPassword = '';

    this.showNewPassword = false;
    this.showConfirmPassword = false;

    this.isSendingOtp = false;
    this.isVerifyingOtp = false;
    this.isResettingPassword = false;

    this.forgotError = '';
    this.forgotSuccess = '';

    this.stopResendTimer();
  }

  // =========================================================
  // EMAIL VALIDATION
  // =========================================================

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // =========================================================
  // CLEAR MESSAGES
  // =========================================================

  private clearMessages(): void {
    this.loginError = '';
    this.signupError = '';
    this.forgotError = '';
    this.forgotSuccess = '';
  }

  // =========================================================
  // CHANGE DETECTION HELPER
  // =========================================================

  private refreshView(): void {
    this.cdr.markForCheck();

    // In case this callback originated outside
    // Angular's normal change-detection cycle.
    this.cdr.detectChanges();
  }

  // =========================================================
  // COMPONENT DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.stopResendTimer();
  }
}
