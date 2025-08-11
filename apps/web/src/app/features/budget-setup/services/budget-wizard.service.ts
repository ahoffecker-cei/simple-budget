import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { BudgetWizardRequest, BudgetWizardResponse } from '../../../../../../../shared/src/models';
import { environment } from '../../../../environments/environment';

export interface WizardStep {
  stepIndex: number;
  isValid: boolean;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetWizardService {
  private readonly apiUrl = `${environment.apiBaseUrl}/budget/wizard`;
  
  private wizardDataSubject = new BehaviorSubject<Partial<BudgetWizardRequest>>({
    majorExpenses: {}
  });
  
  private stepsSubject = new BehaviorSubject<WizardStep[]>([
    { stepIndex: 0, isValid: false, data: {} }, // Income
    { stepIndex: 1, isValid: false, data: {} }, // Student Loans  
    { stepIndex: 2, isValid: false, data: {} }, // Major Expenses
    { stepIndex: 3, isValid: false, data: {} }  // Savings Goals
  ]);

  wizardData$ = this.wizardDataSubject.asObservable();
  steps$ = this.stepsSubject.asObservable();

  constructor(private http: HttpClient) {}

  updateStepData(stepIndex: number, data: any, isValid: boolean): void {
    const currentData = this.wizardDataSubject.value;
    const updatedData = { ...currentData, ...data };
    this.wizardDataSubject.next(updatedData);

    const steps = this.stepsSubject.value;
    steps[stepIndex] = { stepIndex, isValid, data };
    this.stepsSubject.next([...steps]);
  }

  getStepData(stepIndex: number): any {
    return this.stepsSubject.value[stepIndex]?.data || {};
  }

  isStepValid(stepIndex: number): boolean {
    return this.stepsSubject.value[stepIndex]?.isValid || false;
  }

  canProceedToStep(stepIndex: number): boolean {
    if (stepIndex === 0) return true;
    
    for (let i = 0; i < stepIndex; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  completeWizard(): Observable<BudgetWizardResponse> {
    const wizardData = this.wizardDataSubject.value as BudgetWizardRequest;
    return this.http.post<BudgetWizardResponse>(`${this.apiUrl}/complete`, wizardData);
  }

  resetWizard(): void {
    this.wizardDataSubject.next({ majorExpenses: {} });
    this.stepsSubject.next([
      { stepIndex: 0, isValid: false, data: {} },
      { stepIndex: 1, isValid: false, data: {} },
      { stepIndex: 2, isValid: false, data: {} },
      { stepIndex: 3, isValid: false, data: {} }
    ]);
  }
}