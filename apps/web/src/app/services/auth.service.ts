import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check token expiration on service initialization
    this.checkTokenExpiration();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, request)
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.handleLogout())
      );
  }

  logoutLocal(): void {
    this.handleLogout();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Store token and user data
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    localStorage.setItem('token_expires_at', response.expiresAt);

    // Update subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);

    // Set up token expiration check
    this.scheduleTokenExpirationCheck(new Date(response.expiresAt));
  }

  private handleLogout(): void {
    // Clear storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('token_expires_at');

    // Update subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        localStorage.removeItem(this.userKey);
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expiration = new Date(expiresAt);
      if (expiration <= new Date()) {
        this.handleLogout();
        return false;
      }
    }

    return true;
  }

  private checkTokenExpiration(): void {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expiration = new Date(expiresAt);
      if (expiration <= new Date()) {
        this.handleLogout();
      } else {
        this.scheduleTokenExpirationCheck(expiration);
      }
    }
  }

  private scheduleTokenExpirationCheck(expirationDate: Date): void {
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();
    
    // Schedule logout 1 minute before token expiration
    const timeUntilLogout = Math.max(0, timeUntilExpiration - 60000);
    
    setTimeout(() => {
      this.handleLogout();
    }, timeUntilLogout);
  }

  refreshCurrentUser(): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No current user to refresh');
    }

    return this.http.get<User>(`${this.baseUrl}/Users/${currentUser.userId}`).pipe(
      tap(user => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}