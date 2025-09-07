# 📚 Expense Tracker Developer Guide

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [API Architecture](#api-architecture)
- [Authentication & Security](#authentication--security)
- [Frontend Architecture](#frontend-architecture)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Deployment Architecture](#deployment-architecture)
- [Performance Considerations](#performance-considerations)
- [Monitoring & Logging](#monitoring--logging)

---

## Overview

The Expense Tracker is a comprehensive bill-splitting and expense management platform designed to help individuals and groups track, share, and settle expenses efficiently. The application follows a microservices-inspired modular architecture with clear separation of concerns between different functional domains.

### Key Features
- **Multi-user expense tracking** with real-time synchronization
- **Intelligent bill splitting** algorithms (equal, percentage, shares, exact amounts)
- **Multi-currency support** with automatic conversion
- **OCR receipt scanning** for automatic expense entry
- **Payment gateway integration** (Stripe, PayPal)
- **Advanced analytics** and spending insights
- **Offline-first architecture** with background sync
- **Real-time notifications** via WebSockets

---

## System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[React Web App]
        MOBILE[Mobile App - Future]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
    end
    
    subgraph "Application Layer"
        DJANGO[Django REST API]
        CELERY[Celery Workers]
        BEAT[Celery Beat Scheduler]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL DB)]
        REDIS[(Redis Cache)]
        S3[AWS S3 Storage]
    end
    
    subgraph "External Services"
        STRIPE[Stripe API]
        PAYPAL[PayPal API]
        OCR[Tesseract OCR]
        EMAIL[Email Service]
        SMS[Twilio SMS]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    NGINX --> DJANGO
    DJANGO --> POSTGRES
    DJANGO --> REDIS
    DJANGO --> S3
    CELERY --> POSTGRES
    CELERY --> REDIS
    BEAT --> CELERY
    CELERY --> STRIPE
    CELERY --> PAYPAL
    CELERY --> OCR
    CELERY --> EMAIL
    CELERY --> SMS
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant C as Cache
    participant Q as Queue
    participant W as Worker
    
    U->>F: Create Expense
    F->>A: POST /api/expenses/
    A->>C: Check cache
    A->>D: Save expense
    A->>Q: Queue notifications
    A-->>F: Return response
    Q->>W: Process task
    W->>D: Update analytics
    W-->>U: Send notification
```

---

## Technology Stack

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Core programming language |
| Django | 4.2.7 | Web framework |
| Django REST Framework | 3.14.0 | REST API framework |
| PostgreSQL | 13+ | Primary database |
| Redis | 7.0 | Caching & message broker |
| Celery | 5.3.4 | Async task processing |
| Gunicorn | 20.1.0 | WSGI HTTP Server |
| Nginx | 1.21+ | Reverse proxy & static files |

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 4.9.5 | Type-safe JavaScript |
| Redux Toolkit | 2.9.0 | State management |
| Material-UI | 5.16.7 | Component library |
| Axios | 1.11.0 | HTTP client |
| Recharts | 3.1.2 | Data visualization |
| React Router | 7.8.2 | Client-side routing |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development orchestration |
| GitHub Actions | CI/CD pipeline |
| AWS | Cloud infrastructure |
| Sentry | Error tracking |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |

---

## Project Structure

### Backend Structure

```
backend/
├── config/                 # Django configuration
│   ├── settings.py        # Main settings file
│   ├── urls.py           # Root URL configuration
│   ├── wsgi.py          # WSGI application
│   ├── asgi.py          # ASGI application
│   └── celery.py        # Celery configuration
│
├── apps/                  # Django applications
│   ├── authentication/   # User management & auth
│   │   ├── models.py    # User, Profile, Device models
│   │   ├── serializers.py
│   │   ├── views.py     # Auth endpoints
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   └── tests.py
│   │
│   ├── expenses/        # Core expense functionality
│   │   ├── models.py   # Expense, Share, Recurring models
│   │   ├── serializers.py
│   │   ├── views.py    # CRUD operations
│   │   ├── filters.py  # Query filters
│   │   ├── tasks.py    # Async tasks
│   │   └── tests.py
│   │
│   ├── groups/         # Group management
│   │   ├── models.py  # Group, Membership models
│   │   ├── serializers.py
│   │   ├── views.py   # Group operations
│   │   ├── permissions.py
│   │   └── tests.py
│   │
│   ├── payments/      # Payment processing
│   │   ├── models.py # Settlement, Payment models
│   │   ├── serializers.py
│   │   ├── views.py  # Payment endpoints
│   │   ├── gateways/ # Payment gateway integrations
│   │   └── tests.py
│   │
│   ├── analytics/    # Analytics & reporting
│   │   ├── models.py # Analytics models
│   │   ├── views.py  # Report endpoints
│   │   ├── tasks.py  # Report generation
│   │   └── tests.py
│   │
│   ├── notifications/ # Notification system
│   │   ├── models.py # Notification models
│   │   ├── views.py  # Notification endpoints
│   │   ├── tasks.py  # Email/SMS sending
│   │   └── tests.py
│   │
│   └── core/         # Shared functionality
│       ├── models.py # Base models, Currency, Category
│       ├── utils.py  # Utility functions
│       ├── exceptions.py
│       └── middleware.py
│
├── static/           # Static files
├── media/           # User uploads
├── templates/       # Email templates
├── requirements/    # Dependencies
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── manage.py       # Django management script
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Generic components
│   │   ├── auth/        # Authentication components
│   │   ├── expenses/    # Expense-related components
│   │   ├── groups/      # Group components
│   │   └── dashboard/   # Dashboard components
│   │
│   ├── pages/           # Page-level components
│   │   ├── Dashboard.tsx
│   │   ├── Expenses.tsx
│   │   ├── Groups.tsx
│   │   ├── Analytics.tsx
│   │   └── Settings.tsx
│   │
│   ├── store/          # Redux store
│   │   ├── index.ts
│   │   └── slices/    # Redux slices
│   │       ├── authSlice.ts
│   │       ├── expenseSlice.ts
│   │       ├── groupSlice.ts
│   │       └── notificationSlice.ts
│   │
│   ├── services/      # API services
│   │   ├── api.ts    # Axios configuration
│   │   ├── auth.service.ts
│   │   ├── expense.service.ts
│   │   └── group.service.ts
│   │
│   ├── hooks/        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── useOffline.ts
│   │
│   ├── utils/       # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── types/       # TypeScript definitions
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── redux.ts
│   │
│   ├── assets/     # Static assets
│   └── styles/     # Global styles
│
├── public/         # Public assets
├── tests/         # Test files
└── package.json   # Dependencies
```

---

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Expense : creates
    User ||--o{ GroupMembership : has
    User ||--o{ ExpenseShare : owes
    User ||--o{ Settlement : participates
    User ||--o{ PaymentMethod : owns
    User ||--o{ Notification : receives
    User ||--|| UserProfile : has
    
    Group ||--o{ GroupMembership : contains
    Group ||--o{ Expense : has
    Group ||--o{ GroupActivity : tracks
    
    Expense ||--o{ ExpenseShare : splits_into
    Expense ||--o{ ExpenseComment : has
    Expense }o--|| Category : belongs_to
    Expense }o--|| Currency : uses
    
    ExpenseShare }o--|| Settlement : settled_by
    
    Settlement ||--o{ Payment : contains
    Payment }o--|| PaymentMethod : uses
    
    RecurringExpense ||--o{ Expense : generates
```

### Core Database Tables

#### Authentication Domain

| Table | Description | Key Fields |
|-------|-------------|------------|
| **auth_user** | Custom user model | email, username, preferred_currency, timezone |
| **user_profiles** | Extended user info | occupation, country, total_expenses |
| **user_friendships** | Friend connections | from_user, to_user, status |
| **user_devices** | Push notification devices | device_token, device_type |
| **email_verifications** | Email verification tokens | token, expires_at |

#### Expense Domain

| Table | Description | Key Fields |
|-------|-------------|------------|
| **expenses** | Core expense records | title, amount, currency, paid_by, expense_date |
| **expense_shares** | Individual shares of expenses | expense, user, amount, is_settled |
| **recurring_expenses** | Recurring expense templates | frequency, next_due_date |
| **expense_comments** | Comments on expenses | expense, user, comment |

#### Group Domain

| Table | Description | Key Fields |
|-------|-------------|------------|
| **groups** | Expense groups | name, currency, invite_code |
| **group_memberships** | User-group relationships | user, group, role, status |
| **group_invitations** | Pending invitations | email, expires_at |
| **group_activities** | Activity feed | activity_type, description |

#### Payment Domain

| Table | Description | Key Fields |
|-------|-------------|------------|
| **payment_methods** | User payment methods | method_type, external_id |
| **settlements** | Money owed between users | payer, payee, amount, status |
| **payments** | Actual payment transactions | settlement, external_transaction_id |
| **payment_webhooks** | Webhook event tracking | service, event_type, payload |

### Database Indexing Strategy

```sql
-- Performance-critical indexes
CREATE INDEX idx_expenses_user_date ON expenses(paid_by, expense_date DESC);
CREATE INDEX idx_expenses_group_date ON expenses(group_id, expense_date DESC);
CREATE INDEX idx_expense_shares_user_settled ON expense_shares(user_id, is_settled);
CREATE INDEX idx_settlements_status_due ON settlements(status, due_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_expenses_title_search ON expenses USING gin(to_tsvector('english', title));
CREATE INDEX idx_groups_name_search ON groups USING gin(to_tsvector('english', name));
```

---

## API Architecture

### RESTful API Design Principles

1. **Resource-Based URLs**: `/api/expenses/`, `/api/groups/{id}/members/`
2. **HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
3. **Status Codes**: Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
4. **Pagination**: Consistent pagination across all list endpoints
5. **Filtering**: Query parameter-based filtering
6. **Versioning**: API versioning through headers or URL

### API Endpoint Structure

```
/api/
├── /auth/
│   ├── POST   /register/          # User registration
│   ├── POST   /login/             # User login
│   ├── POST   /logout/            # User logout
│   ├── POST   /refresh/           # Token refresh
│   ├── POST   /verify-email/      # Email verification
│   └── POST   /reset-password/    # Password reset
│
├── /expenses/
│   ├── GET    /                   # List expenses
│   ├── POST   /                   # Create expense
│   ├── GET    /{id}/              # Get expense details
│   ├── PUT    /{id}/              # Update expense
│   ├── DELETE /{id}/              # Delete expense
│   ├── POST   /{id}/split/        # Update split
│   ├── POST   /{id}/settle/       # Settle expense
│   └── GET    /{id}/shares/       # Get expense shares
│
├── /groups/
│   ├── GET    /                   # List groups
│   ├── POST   /                   # Create group
│   ├── GET    /{id}/              # Get group details
│   ├── PUT    /{id}/              # Update group
│   ├── DELETE /{id}/              # Delete group
│   ├── GET    /{id}/members/      # List members
│   ├── POST   /{id}/invite/       # Invite member
│   ├── POST   /{id}/leave/        # Leave group
│   └── GET    /{id}/balances/     # Get balances
│
├── /payments/
│   ├── GET    /methods/           # List payment methods
│   ├── POST   /methods/           # Add payment method
│   ├── GET    /settlements/       # List settlements
│   ├── POST   /settlements/       # Create settlement
│   ├── POST   /settlements/{id}/confirm/  # Confirm settlement
│   └── POST   /process/           # Process payment
│
├── /analytics/
│   ├── GET    /summary/           # Get expense summary
│   ├── GET    /trends/            # Get spending trends
│   ├── GET    /categories/        # Category breakdown
│   └── POST   /reports/generate/  # Generate report
│
└── /notifications/
    ├── GET    /                   # List notifications
    ├── PUT    /{id}/read/         # Mark as read
    ├── GET    /preferences/       # Get preferences
    └── PUT    /preferences/       # Update preferences
```

### API Request/Response Format

#### Standard Request Format
```json
{
  "data": {
    "type": "expense",
    "attributes": {
      "title": "Dinner at Restaurant",
      "amount": 150.00,
      "currency": "USD",
      "category_id": "uuid-here",
      "expense_date": "2024-01-15"
    },
    "relationships": {
      "group": {
        "data": {
          "type": "group",
          "id": "group-uuid"
        }
      }
    }
  }
}
```

#### Standard Response Format
```json
{
  "status": "success",
  "data": {
    "id": "expense-uuid",
    "type": "expense",
    "attributes": {
      "title": "Dinner at Restaurant",
      "amount": 150.00,
      "currency": "USD",
      "created_at": "2024-01-15T18:30:00Z"
    },
    "relationships": {
      "paid_by": {
        "data": {
          "type": "user",
          "id": "user-uuid"
        }
      }
    }
  },
  "meta": {
    "timestamp": "2024-01-15T18:30:00Z",
    "version": "1.0"
  }
}
```

#### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T18:30:00Z",
    "request_id": "req-uuid"
  }
}
```

---

## Authentication & Security

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis
    participant DB
    
    Client->>API: POST /auth/login (email, password)
    API->>DB: Validate credentials
    DB-->>API: User data
    API->>API: Generate JWT tokens
    API->>Redis: Store refresh token
    API-->>Client: Access token + Refresh token
    
    Client->>API: GET /api/expenses (Bearer token)
    API->>API: Validate JWT
    API->>DB: Fetch data
    API-->>Client: Response
    
    Client->>API: POST /auth/refresh (Refresh token)
    API->>Redis: Validate refresh token
    API->>API: Generate new access token
    API-->>Client: New access token
```

### Security Measures

#### 1. Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (1 hour) with refresh tokens (7 days)
- **Role-Based Access Control (RBAC)**: User roles (user, premium, admin)
- **Group Permissions**: Admin, member, viewer roles within groups
- **API Rate Limiting**: Per-user and per-IP rate limits

#### 2. Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Data Encryption**: AES-256 for sensitive data at rest
- **TLS/SSL**: HTTPS enforced in production
- **CORS Configuration**: Strict origin validation

#### 3. Input Validation & Sanitization
```python
# Example serializer with validation
class ExpenseSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2,
        min_value=Decimal('0.01'),
        max_value=Decimal('999999999.99')
    )
    title = serializers.CharField(
        max_length=200,
        validators=[no_sql_injection_validator]
    )
    
    def validate_expense_date(self, value):
        if value > date.today():
            raise ValidationError("Expense date cannot be in the future")
        return value
```

#### 4. Security Headers
```python
# Security middleware configuration
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## Frontend Architecture

### Component Architecture

```mermaid
graph TD
    App[App Component]
    App --> Router[React Router]
    Router --> Auth[Auth Layout]
    Router --> Dashboard[Dashboard Layout]
    
    Auth --> Login[Login Page]
    Auth --> Register[Register Page]
    
    Dashboard --> Header[Header Component]
    Dashboard --> Sidebar[Sidebar Navigation]
    Dashboard --> Content[Content Area]
    
    Content --> ExpensePage[Expense Page]
    Content --> GroupPage[Group Page]
    Content --> AnalyticsPage[Analytics Page]
    
    ExpensePage --> ExpenseList[Expense List]
    ExpensePage --> ExpenseForm[Expense Form]
    ExpenseList --> ExpenseItem[Expense Item]
    
    GroupPage --> GroupList[Group List]
    GroupPage --> GroupDetail[Group Detail]
    GroupDetail --> MemberList[Member List]
    GroupDetail --> GroupBalance[Balance View]
```

### State Management with Redux

```typescript
// Store structure
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    tokens: {
      access: string;
      refresh: string;
    };
  };
  expenses: {
    items: Expense[];
    loading: boolean;
    filters: ExpenseFilters;
    pagination: PaginationState;
  };
  groups: {
    items: Group[];
    activeGroup: Group | null;
    members: GroupMember[];
  };
  notifications: {
    items: Notification[];
    unreadCount: number;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    modals: ModalState;
  };
}
```

### Component Design Patterns

#### 1. Container/Presentational Pattern
```typescript
// Container component
const ExpenseListContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector(selectExpenses);
  
  useEffect(() => {
    dispatch(fetchExpenses());
  }, [dispatch]);
  
  return <ExpenseList expenses={expenses} />;
};

// Presentational component
const ExpenseList: React.FC<Props> = ({ expenses }) => {
  return (
    <List>
      {expenses.map(expense => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}
    </List>
  );
};
```

#### 2. Custom Hooks Pattern
```typescript
// Custom hook for expense management
const useExpenses = () => {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector(selectExpenses);
  const loading = useAppSelector(selectExpensesLoading);
  
  const createExpense = useCallback((data: ExpenseData) => {
    return dispatch(createExpenseThunk(data));
  }, [dispatch]);
  
  const updateExpense = useCallback((id: string, data: ExpenseData) => {
    return dispatch(updateExpenseThunk({ id, data }));
  }, [dispatch]);
  
  return {
    expenses,
    loading,
    createExpense,
    updateExpense
  };
};
```

---

## Development Workflow

### Git Workflow

```mermaid
gitGraph
    commit id: "main"
    branch develop
    checkout develop
    commit id: "feature start"
    branch feature/expense-split
    checkout feature/expense-split
    commit id: "add split logic"
    commit id: "add tests"
    checkout develop
    merge feature/expense-split
    branch feature/notifications
    checkout feature/notifications
    commit id: "add email"
    checkout develop
    merge feature/notifications
    checkout main
    merge develop tag: "v1.0.0"
```

### Development Process

1. **Branch Creation**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Development**
   - Write code following style guides
   - Add unit tests
   - Update documentation

3. **Testing**
   ```bash
   # Backend
   python manage.py test
   
   # Frontend
   npm test
   ```

4. **Code Review**
   - Create pull request
   - Pass CI/CD checks
   - Get approval from reviewers

5. **Deployment**
   - Merge to develop
   - Automatic deployment to staging
   - Manual promotion to production

### Code Style Guidelines

#### Python/Django
- Follow PEP 8
- Use type hints
- Maximum line length: 88 (Black formatter)
- Docstrings for all public methods

#### TypeScript/React
- ESLint + Prettier configuration
- Functional components with hooks
- Named exports for components
- Interface over type for object shapes

---

## Testing Strategy

### Testing Pyramid

```mermaid
graph TD
    E2E[E2E Tests - 10%]
    Integration[Integration Tests - 30%]
    Unit[Unit Tests - 60%]
    
    E2E --> Integration
    Integration --> Unit
    
    style E2E fill:#f96
    style Integration fill:#fc6
    style Unit fill:#9f6
```

### Backend Testing

#### Unit Tests
```python
class ExpenseModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
    def test_expense_creation(self):
        expense = Expense.objects.create(
            title='Test Expense',
            amount=Decimal('100.00'),
            paid_by=self.user,
            expense_date=date.today()
        )
        self.assertEqual(expense.title, 'Test Expense')
        self.assertEqual(expense.amount, Decimal('100.00'))
```

#### Integration Tests
```python
class ExpenseAPITest(APITestCase):
    def test_create_expense(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/expenses/', {
            'title': 'Test Expense',
            'amount': 100.00,
            'expense_date': '2024-01-15'
        })
        self.assertEqual(response.status_code, 201)
```

### Frontend Testing

#### Component Tests
```typescript
describe('ExpenseForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Expense' }
    });
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Expense'
      });
    });
  });
});
```

---

## Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph "AWS Infrastructure"
        subgraph "Public Subnet"
            ALB[Application Load Balancer]
            NAT[NAT Gateway]
        end
        
        subgraph "Private Subnet A"
            EC2A[EC2 - Django App]
            WORKER_A[EC2 - Celery Worker]
        end
        
        subgraph "Private Subnet B"
            EC2B[EC2 - Django App]
            WORKER_B[EC2 - Celery Worker]
        end
        
        subgraph "Data Layer"
            RDS[(RDS PostgreSQL)]
            ELASTICACHE[(ElastiCache Redis)]
            S3[S3 Bucket]
        end
        
        CF[CloudFront CDN]
    end
    
    Internet --> CF
    CF --> ALB
    ALB --> EC2A
    ALB --> EC2B
    EC2A --> RDS
    EC2B --> RDS
    EC2A --> ELASTICACHE
    EC2B --> ELASTICACHE
    WORKER_A --> RDS
    WORKER_B --> RDS
```

### Deployment Process

#### 1. Build & Test
```yaml
# GitHub Actions CI/CD
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          python manage.py test
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          aws ecs update-service --cluster production --service app
```

#### 2. Container Configuration
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## Performance Considerations

### Database Optimization

#### 1. Query Optimization
```python
# Use select_related for foreign keys
expenses = Expense.objects.select_related(
    'paid_by', 'category', 'currency'
).filter(group=group)

# Use prefetch_related for many-to-many
groups = Group.objects.prefetch_related(
    'memberships__user',
    'expenses__shares'
)
```

#### 2. Database Connection Pooling
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'
        }
    }
}
```

### Caching Strategy

#### 1. Redis Cache Layers
```python
# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'timeout': 20,
            }
        }
    }
}
```

#### 2. Cache Implementation
```python
from django.core.cache import cache

def get_user_expenses(user_id):
    cache_key = f'user_expenses_{user_id}'
    expenses = cache.get(cache_key)
    
    if expenses is None:
        expenses = Expense.objects.filter(
            paid_by_id=user_id
        ).select_related('category', 'currency')
        cache.set(cache_key, expenses, timeout=300)
    
    return expenses
```

### Frontend Optimization

#### 1. Code Splitting
```typescript
// Lazy loading of routes
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

#### 2. Memoization
```typescript
// Memoized selectors
export const selectExpensesByGroup = createSelector(
  [selectAllExpenses, (state, groupId) => groupId],
  (expenses, groupId) => expenses.filter(e => e.groupId === groupId)
);

// Memoized components
const ExpenseItem = React.memo(({ expense }) => {
  return <div>{expense.title}</div>;
});
```

---

## Monitoring & Logging

### Application Monitoring

```mermaid
graph LR
    App[Application] --> Metrics[Prometheus]
    App --> Logs[ELK Stack]
    App --> Errors[Sentry]
    
    Metrics --> Grafana[Grafana Dashboard]
    Logs --> Kibana[Kibana Dashboard]
    Errors --> Alerts[Alert Manager]
    
    Alerts --> Email[Email]
    Alerts --> Slack[Slack]
```

### Logging Configuration

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/expense_tracker/app.log',
            'maxBytes': 1024 * 1024 * 100,  # 100MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'sentry_sdk.integrations.logging.EventHandler',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file', 'sentry'],
    },
}
```

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Response Time | > 500ms | Warning |
| Error Rate | > 1% | Critical |
| Database Connection Pool | > 80% | Warning |
| Redis Memory Usage | > 75% | Warning |
| Celery Queue Length | > 1000 | Warning |
| Disk Usage | > 80% | Critical |

---

## Appendix

### Useful Commands

```bash
# Backend Development
python manage.py makemigrations    # Create migrations
python manage.py migrate           # Apply migrations
python manage.py createsuperuser   # Create admin user
python manage.py shell            # Django shell
python manage.py test             # Run tests
python manage.py collectstatic    # Collect static files

# Celery Commands
celery -A config worker -l info   # Start worker
celery -A config beat -l info     # Start scheduler
celery -A config flower           # Start monitoring

# Frontend Development
npm start                         # Start dev server
npm test                         # Run tests
npm run build                    # Build for production
npm run analyze                  # Analyze bundle size

# Docker Commands
docker-compose up -d             # Start all services
docker-compose logs -f app       # View logs
docker-compose exec app bash     # Shell into container
docker-compose down              # Stop all services
```

### Environment Variables

```bash
# Backend (.env)
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379/0
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
STRIPE_SECRET_KEY=sk_test_xxx
SENTRY_DSN=https://xxx@sentry.io/xxx

# Frontend (.env)
REACT_APP_API_URL=https://api.example.com
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_xxx
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Further Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Material-UI](https://mui.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

*Last Updated: January 2024*
*Version: 1.0.0*
