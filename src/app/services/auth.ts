import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:8000';

  // =========================================================
  // LOGIN STATE
  // =========================================================

  private loggedInSubject = new BehaviorSubject<boolean>(!!sessionStorage.getItem('token'));

  loggedIn$ = this.loggedInSubject.asObservable();

  // =========================================================
  // LOGIN
  // =========================================================

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        console.log('Login response:', response);

        // -------------------------------------------------
        // SAVE TOKEN
        // -------------------------------------------------

        if (response?.access_token) {
          sessionStorage.setItem('token', response.access_token);
        }

        // -------------------------------------------------
        // SAVE USER
        // -------------------------------------------------

        if (response?.user) {
          sessionStorage.setItem('user', JSON.stringify(response.user));
        }

        // -------------------------------------------------
        // UPDATE LOGIN STATE
        // -------------------------------------------------

        this.loggedInSubject.next(true);

        console.log('Login state:', true);
      }),
    );
  }

  // =========================================================
  // SIGNUP
  // =========================================================

  signup(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, data);
  }

  // =========================================================
  // PROFILE DETAIL
  // =========================================================

  getProfileDetail(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile-detail/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data, {
      headers: this.authHeaders(),
    });
  }

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  changePassword(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/change-password`, data, {
      headers: this.authHeaders(),
    });
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/logout`,
      {},
      {
        headers: this.authHeaders(),
      },
    );
  }

  // =========================================================
  // AUTH HEADERS
  // =========================================================

  private authHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // =========================================================
  // SET LOGIN STATE
  // =========================================================

  setLoggedIn(value: boolean): void {
    this.loggedInSubject.next(value);
  }

  // =========================================================
  // IS LOGGED IN
  // =========================================================

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // =========================================================
  // GET USER
  // =========================================================

  getUser(): any | null {
    const user = sessionStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Invalid user session:', error);

      return null;
    }
  }

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  clearSession(): void {
    console.log('Clearing authentication session');

    sessionStorage.removeItem('token');

    sessionStorage.removeItem('user');

    this.loggedInSubject.next(false);
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/forgot-password`,
      {
        email: email.trim(),
      },
      {
        responseType: 'text',
      },
    );
  }

  // =========================================================
  // VERIFY FORGOT PASSWORD OTP
  // =========================================================

  verifyForgotPasswordOTP(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/verify-otp`, {
      email: email.trim(),
      otp: otp.trim(),
    });
  }

  // =========================================================
  // RESET FORGOTTEN PASSWORD
  // =========================================================

  resetForgottenPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/reset`, {
      email: email.trim(),
      otp: otp.trim(),
      new_password: newPassword,
    });
  }
}
