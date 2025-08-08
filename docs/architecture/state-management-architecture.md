# State Management Architecture

## State Structure

```typescript
// Service-based state management using RxJS
@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  private readonly _state$ = new BehaviorSubject<DashboardState>(this.initialState);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly state$ = this._state$.asObservable();
  readonly loading$ = this._loading$.asObservable();
  readonly error$ = this._error$.asObservable();
  
  // Computed observables
  readonly healthStatus$ = this.state$.pipe(
    map(state => state.healthStatus),
    distinctUntilChanged()
  );

  constructor(private dashboardService: DashboardService) {}

  // Action methods
  loadDashboard(): Observable<DashboardState> {
    this._loading$.next(true);
    this._error$.next(null);
    
    return this.dashboardService.getDashboardData().pipe(
      tap(data => {
        this._state$.next({
          ...this._state$.value,
          ...data,
          lastUpdated: new Date()
        });
        this._loading$.next(false);
      }),
      catchError(error => {
        this._error$.next('Failed to load dashboard data');
        this._loading$.next(false);
        return throwError(error);
      })
    );
  }
}
```
