# Frontend Services Layer

## API Client Setup

```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Something went wrong. Please try again.';
    
    if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Please check your internet connection.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. We\'re working to fix this.';
    }

    return throwError({ message: errorMessage, originalError: error });
  }
}
```
