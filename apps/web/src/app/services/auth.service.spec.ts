import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    userId: '123',
    email: 'test@example.com',
    firstName: 'Test',
    monthlyIncome: 5000,
    studentLoanPayment: 300,
    studentLoanBalance: 15000,
    createdAt: '2023-01-01T00:00:00Z',
    lastLoginAt: '2023-01-01T00:00:00Z'
  };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-jwt-token',
    user: mockUser,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('register', () => {
    it('should register user and handle auth success', (done) => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'TestPassword123',
        firstName: 'Test',
        monthlyIncome: 5000
      };

      service.register(registerRequest).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.getToken()).toBe(mockAuthResponse.token);
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockAuthResponse);
    });

    it('should handle registration error', (done) => {
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        monthlyIncome: 5000
      };

      service.register(registerRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
      req.flush({ error: { message: 'Weak password' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('login', () => {
    it('should login user and handle auth success', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      service.login(loginRequest).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.getToken()).toBe(mockAuthResponse.token);
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
      req.flush({ error: { message: 'Invalid credentials' } }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString());
    });

    it('should logout user and clear storage', (done) => {
      service.logout().subscribe(response => {
        expect(response).toBeDefined();
        expect(service.getToken()).toBeNull();
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Logged out successfully' });
    });

    it('should handle server logout failure gracefully', (done) => {
      service.logout().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          // Even if server logout fails, local logout should still work
          expect(service.getToken()).toBeNull();
          expect(service.getCurrentUser()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/logout`);
      req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('logoutLocal', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString());
    });

    it('should clear local storage and navigate to login', () => {
      service.logoutLocal();

      expect(service.getToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token expiration', () => {
    it('should return false for isAuthenticated when token is expired', () => {
      // Set up expired token
      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('token_expires_at', new Date(Date.now() - 3600000).toISOString()); // 1 hour ago

      const result = service.isAuthenticated();

      expect(result).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return true for isAuthenticated when token is valid', () => {
      // Set up valid token
      localStorage.setItem('auth_token', 'valid-token');
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString()); // 1 hour from now

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });
  });

  describe('token management', () => {
    it('should return stored token', () => {
      const token = 'test-token';
      localStorage.setItem('auth_token', token);

      expect(service.getToken()).toBe(token);
    });

    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored user', () => {
      localStorage.setItem('current_user', JSON.stringify(mockUser));

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when no user stored', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should handle corrupted user data in localStorage', () => {
      localStorage.setItem('current_user', 'invalid-json');

      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
    });
  });
});