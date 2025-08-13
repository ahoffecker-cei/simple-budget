import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StudentLoansService, CreateStudentLoanRequest, UpdateStudentLoanRequest } from './student-loans.service';
import { StudentLoanSummary, StudentLoan } from '@simple-budget/shared';
import { environment } from '../../environments/environment';

describe('StudentLoansService', () => {
  let service: StudentLoansService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}/api/StudentLoans`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StudentLoansService]
    });
    service = TestBed.inject(StudentLoansService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get student loans summary', () => {
    const mockSummary: StudentLoanSummary = {
      totalBalance: 50000,
      totalMonthlyPayment: 500,
      averageInterestRate: 5.5,
      totalLoans: 2,
      loans: []
    };

    service.getStudentLoans().subscribe(summary => {
      expect(summary).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should get individual student loan', () => {
    const loanId = '123';
    const mockLoan: StudentLoan = {
      id: loanId,
      userId: 'user123',
      servicerName: 'Test Servicer',
      accountNumber: '****1234',
      balance: 25000,
      interestRate: 5.0,
      monthlyPayment: 250,
      loanType: 'federal',
      status: 'active',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    service.getStudentLoan(loanId).subscribe(loan => {
      expect(loan).toEqual(mockLoan);
    });

    const req = httpMock.expectOne(`${apiUrl}/${loanId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLoan);
  });

  it('should create student loan', () => {
    const createRequest: CreateStudentLoanRequest = {
      servicerName: 'Test Servicer',
      accountNumber: '1234567890',
      balance: 25000,
      interestRate: 5.0,
      monthlyPayment: 250,
      loanType: 'federal',
      status: 'active'
    };

    const mockLoan: StudentLoan = {
      id: '123',
      userId: 'user123',
      ...createRequest,
      accountNumber: '****7890',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    service.createStudentLoan(createRequest).subscribe(loan => {
      expect(loan).toEqual(mockLoan);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);
    req.flush(mockLoan);
  });

  it('should update student loan', () => {
    const loanId = '123';
    const updateRequest: UpdateStudentLoanRequest = {
      servicerName: 'Updated Servicer',
      accountNumber: '1234567890',
      balance: 24000,
      interestRate: 4.5,
      monthlyPayment: 240,
      loanType: 'federal',
      status: 'active'
    };

    service.updateStudentLoan(loanId, updateRequest).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${loanId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush(null);
  });

  it('should delete student loan', () => {
    const loanId = '123';

    service.deleteStudentLoan(loanId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${loanId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});