# REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Simple Budget API
  version: 1.0.0
  description: RESTful API for Simple Budget - Reassuring financial companion for young adults
servers:
  - url: https://simplebudget-api.azurewebsites.net/api/v1
    description: Production API
  - url: https://localhost:5001/api/v1
    description: Development API

paths:
  # Authentication Endpoints
  /auth/register:
    post:
      tags: [Authentication]
      summary: Register new user account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          description: Invalid registration data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /auth/login:
    post:
      tags: [Authentication]
      summary: Authenticate user and return JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid credentials

  # Dashboard Endpoints
  /dashboard:
    get:
      tags: [Dashboard]
      summary: Get complete dashboard data for "Am I doing okay?" view
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Complete dashboard data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DashboardResponse'

  # Budget Categories Endpoints
  /budget-categories:
    get:
      tags: [Budget]
      summary: Get all budget categories with current spending
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of budget categories with spending data
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BudgetCategoryWithSpending'

    post:
      tags: [Budget]
      summary: Create new budget category
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBudgetCategoryRequest'
      responses:
        '201':
          description: Budget category created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BudgetCategory'

  # Accounts Endpoints
  /accounts:
    get:
      tags: [Accounts]
      summary: Get all user accounts with balances
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of user accounts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Account'

  # Expenses Endpoints
  /expenses:
    get:
      tags: [Expenses]
      summary: Get user expenses with pagination and filtering
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
        - name: categoryId
          in: query
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Paginated list of expenses
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExpensesResponse'

    post:
      tags: [Expenses]
      summary: Create new expense entry
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateExpenseRequest'
      responses:
        '201':
          description: Expense created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExpenseWithBudgetImpact'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Core Entity Schemas
    User:
      type: object
      properties:
        userId:
          type: string
          format: uuid
        email:
          type: string
        firstName:
          type: string
        monthlyIncome:
          type: number
        studentLoanPayment:
          type: number
        studentLoanBalance:
          type: number
        createdAt:
          type: string
          format: date-time
        lastLoginAt:
          type: string
          format: date-time

    BudgetCategory:
      type: object
      properties:
        categoryId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        name:
          type: string
        monthlyLimit:
          type: number
        isEssential:
          type: boolean
        description:
          type: string
        createdAt:
          type: string
          format: date-time

    Account:
      type: object
      properties:
        accountId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        accountType:
          type: string
          enum: [checking, savings, retirement]
        accountName:
          type: string
        currentBalance:
          type: number
        lastUpdated:
          type: string
          format: date-time

    # Dashboard Schemas
    DashboardResponse:
      type: object
      properties:
        overallHealthStatus:
          type: string
          enum: [excellent, good, attention, concern]
        totalNetWorth:
          type: number
        accounts:
          type: array
          items:
            $ref: '#/components/schemas/Account'
        budgetCategories:
          type: array
          items:
            $ref: '#/components/schemas/BudgetCategoryWithSpending'
        recentExpenses:
          type: array
          items:
            $ref: '#/components/schemas/ExpenseWithBudgetImpact'

    # Request/Response Schemas
    RegisterRequest:
      type: object
      required:
        - email
        - password
        - firstName
        - monthlyIncome
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        firstName:
          type: string
        monthlyIncome:
          type: number
          minimum: 1000
          maximum: 200000

    AuthResponse:
      type: object
      properties:
        token:
          type: string
        user:
          $ref: '#/components/schemas/User'
        expiresAt:
          type: string
          format: date-time

    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            timestamp:
              type: string
              format: date-time
            requestId:
              type: string
```
