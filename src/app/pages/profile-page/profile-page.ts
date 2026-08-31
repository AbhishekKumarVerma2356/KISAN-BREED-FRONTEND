import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css'],
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // =========================================================
  // UI STATES
  // =========================================================

  isEditMode = false;
  isPasswordMode = false;

  isLoading = true;
  isSaving = false;
  isChangingPassword = false;

  errorMessage = '';

  currentUser: any = null;
  currentAddress: any = null;

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
  // PROFILE FORM
  // =========================================================

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    email: ['', [Validators.required, Validators.email]],

    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],

    alternatePhone: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],

    // =========================
    // ADDRESS
    // =========================

    addressType: ['home', Validators.required],

    flatHouseNo: ['', [Validators.required, Validators.maxLength(100)]],

    address1: ['', [Validators.required, Validators.maxLength(255)]],

    address2: ['', Validators.maxLength(255)],

    state: ['', Validators.required],

    cityVillage: ['', [Validators.required, Validators.maxLength(150)]],

    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6,10}$/)]],
  });

  // =========================================================
  // PASSWORD FORM
  // =========================================================

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],

    newPassword: ['', [Validators.required, Validators.minLength(6)]],

    confirmPassword: ['', Validators.required],
  });

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadProfile();
  }

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.currentUser = null;
    this.currentAddress = null;

    // Force UI update
    this.cdr.detectChanges();

    // =======================================================
    // GET USER FROM SESSION
    // =======================================================

    const userData = sessionStorage.getItem('user');

    if (!userData) {
      this.isLoading = false;
      this.errorMessage = 'User session not found. Please login again.';

      this.cdr.detectChanges();

      return;
    }

    let loggedUser: any;

    try {
      loggedUser = JSON.parse(userData);
    } catch (error) {
      console.error('Invalid session user:', error);

      this.isLoading = false;

      this.errorMessage = 'Invalid user session. Please login again.';

      this.cdr.detectChanges();

      return;
    }

    // =======================================================
    // USER ID
    // =======================================================

    const userId = loggedUser?.id;

    if (!userId) {
      console.error('User ID missing from session:', loggedUser);

      this.isLoading = false;

      this.errorMessage = 'User ID not found. Please login again.';

      this.cdr.detectChanges();

      return;
    }

    console.log('Fetching profile for:', userId);

    // =======================================================
    // PROFILE API
    // =======================================================

    this.authService
      .getProfileDetail(userId)
      .pipe(
        finalize(() => {
          console.log('Profile API finished');

          this.isLoading = false;

          // Force Angular UI update
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          console.log('PROFILE API RESPONSE:', response);

          // =================================================
          // IMPORTANT
          // STOP LOADING IMMEDIATELY
          // =================================================

          this.isLoading = false;

          // =================================================
          // API RESPONSE
          //
          // {
          //   message: "...",
          //   user: {
          //      id: "...",
          //      full_name: "...",
          //      ...
          //      address: {...}
          //   }
          // }
          // =================================================

          if (!response || !response.user) {
            console.error('Invalid profile response:', response);

            this.errorMessage = 'Profile data not found.';

            this.cdr.detectChanges();

            return;
          }

          // =================================================
          // USER
          // =================================================

          this.currentUser = response.user;

          // =================================================
          // ADDRESS
          // =================================================

          this.currentAddress = response.user.address ?? null;

          console.log('Current user:', this.currentUser);

          console.log('Current address:', this.currentAddress);

          // =================================================
          // PATCH FORM
          // =================================================

          this.patchProfileForm();

          // =================================================
          // UPDATE SESSION
          // =================================================

          sessionStorage.setItem('user', JSON.stringify(this.currentUser));

          // =================================================
          // FORCE UI UPDATE
          // =================================================

          this.cdr.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          console.error('PROFILE API ERROR:', error);

          this.isLoading = false;

          // =================================================
          // 401
          // =================================================

          if (error.status === 401) {
            sessionStorage.clear();

            this.router.navigate(['/auth']);

            return;
          }

          // =================================================
          // 404
          // =================================================

          if (error.status === 404) {
            this.errorMessage = 'Profile details not found.';
          } else {
            this.errorMessage = error.error?.detail || 'Unable to load profile details.';
          }

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // PATCH FORM
  // =========================================================

  patchProfileForm(): void {
    const user = this.currentUser;
    const address = this.currentAddress;

    console.log('Patching profile form:', user, address);

    this.profileForm.patchValue({
      // =====================================================
      // USER
      // =====================================================

      name: user?.full_name ?? '',

      email: user?.email ?? '',

      phone: user?.contact_number ?? '',

      alternatePhone: user?.alternate_contact_number ?? '',

      // =====================================================
      // ADDRESS
      // =====================================================

      addressType: address?.address_type ?? 'home',

      flatHouseNo: address?.flat_house_no ?? '',

      address1: address?.address1 ?? '',

      address2: address?.address2 ?? '',

      state: address?.state ?? '',

      cityVillage: address?.city_village ?? '',

      pincode: address?.pincode ?? '',
    });
  }

  // =========================================================
  // OPEN EDIT
  // =========================================================

  openEditMode(): void {
    this.isEditMode = true;
    this.isPasswordMode = false;

    this.errorMessage = '';

    this.patchProfileForm();

    this.cdr.detectChanges();
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  cancelEditMode(): void {
    this.isEditMode = false;

    this.errorMessage = '';

    this.patchProfileForm();

    this.cdr.detectChanges();
  }

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  saveProfile(): void {
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();

      return;
    }

    if (this.isSaving) {
      return;
    }

    this.isSaving = true;

    const value = this.profileForm.getRawValue();

    const payload = {
      full_name: value.name?.trim() ?? '',

      email: value.email?.trim() ?? '',

      contact_number: value.phone?.trim() ?? '',

      alternate_contact_number: value.alternatePhone?.trim() || null,

      address: {
        address_type: value.addressType ?? 'home',

        flat_house_no: value.flatHouseNo?.trim() ?? '',

        address1: value.address1?.trim() ?? '',

        address2: value.address2?.trim() || null,

        state: value.state ?? '',

        city_village: value.cityVillage?.trim() ?? '',

        pincode: value.pincode?.trim() ?? '',
      },
    };

    console.log('UPDATE PROFILE PAYLOAD:', payload);

    this.authService
      .updateProfile(payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          console.log('PROFILE UPDATED:', response);

          // =================================================
          // UPDATE USER
          // =================================================

          if (response?.user) {
            this.currentUser = response.user;

            this.currentAddress = response.user.address ?? response.address ?? null;

            // Save latest user
            sessionStorage.setItem('user', JSON.stringify(this.currentUser));
          }

          // =================================================
          // UPDATE FORM
          // =================================================

          this.patchProfileForm();

          // =================================================
          // CLOSE EDIT MODE
          // =================================================

          this.isEditMode = false;

          this.cdr.detectChanges();

          alert(response?.message || 'Profile updated successfully.');
        },

        error: (error: HttpErrorResponse) => {
          console.error('PROFILE UPDATE ERROR:', error);

          alert(error.error?.detail || 'Unable to update profile.');
        },
      });
  }

  // =========================================================
  // PASSWORD MODE
  // =========================================================

  openPasswordMode(): void {
    this.isPasswordMode = true;
    this.isEditMode = false;

    this.errorMessage = '';

    this.passwordForm.reset();

    this.cdr.detectChanges();
  }

  // =========================================================
  // CANCEL PASSWORD
  // =========================================================

  cancelPasswordMode(): void {
    this.isPasswordMode = false;

    this.passwordForm.reset();

    this.cdr.detectChanges();
  }

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();

      return;
    }

    if (this.isChangingPassword) {
      return;
    }

    const value = this.passwordForm.getRawValue();

    if (value.newPassword !== value.confirmPassword) {
      alert('New password and confirm password do not match.');

      return;
    }

    this.isChangingPassword = true;

    this.authService
      .changePassword({
        current_password: value.currentPassword ?? '',

        new_password: value.newPassword ?? '',
      })
      .pipe(
        finalize(() => {
          this.isChangingPassword = false;

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          console.log('PASSWORD CHANGED:', response);

          this.passwordForm.reset();

          this.isPasswordMode = false;

          this.cdr.detectChanges();

          alert(response?.message || 'Password changed successfully.');
        },

        error: (error: HttpErrorResponse) => {
          console.error('CHANGE PASSWORD ERROR:', error);

          alert(error.error?.detail || 'Unable to change password.');
        },
      });
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {
    sessionStorage.clear();

    this.router.navigate(['/auth']);
  }
}
