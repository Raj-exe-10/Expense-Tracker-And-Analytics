# 🚀 Developer Onboarding Guide

Welcome to the Expense Tracker development team! This guide will help you get up and running with the project quickly and efficiently.

## Table of Contents
- [Welcome](#welcome)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Getting Help](#getting-help)

---

## Welcome

### 🎯 Project Overview

The Expense Tracker is a comprehensive bill-splitting and expense management application that helps users:
- Track personal and group expenses
- Split bills fairly among friends
- Manage multi-currency transactions
- Analyze spending patterns
- Process payments and settlements

### 📋 Quick Facts

- **Tech Stack**: Django REST Framework + React TypeScript
- **Database**: PostgreSQL 13+
- **Caching**: Redis 7.0
- **Task Queue**: Celery with Redis
- **Container**: Docker & Docker Compose
- **Version Control**: Git (GitHub)
- **Package Managers**: pip (Python), npm (Node.js)

---

## Prerequisites

### Required Software

Before you begin, ensure you have the following installed on your development machine:

| Software | Version | Installation Guide |
|----------|---------|-------------------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | 13+ | [postgresql.org](https://www.postgresql.org/download/) |
| **Redis** | 7.0+ | [redis.io](https://redis.io/download) |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/downloads) |
| **Docker** | 20.10+ | [docker.com](https://www.docker.com/get-started) |
| **Docker Compose** | 2.0+ | Included with Docker Desktop |

### Recommended IDE/Tools

- **IDE**: VSCode or PyCharm Professional
- **Database Client**: TablePlus, DBeaver, or pgAdmin
- **API Testing**: Postman or Insomnia
- **Redis GUI**: RedisInsight or Another Redis Desktop Manager

### VSCode Extensions

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "github.copilot"
  ]
}
```

---

## Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/expense_tracker_app.git
cd expense_tracker_app

# Create your feature branch
git checkout -b feature/your-name-onboarding
```

### 2. Set Up Python Environment

#### Windows
```powershell
# Create virtual environment
cd backend
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### macOS/Linux
```bash
# Create virtual environment
cd backend
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up Node Environment

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Install global packages (optional but recommended)
npm install -g typescript eslint prettier
```

### 4. Configure Environment Variables

#### Backend Configuration

```bash
# Copy example environment file
cd backend
cp .env.example .env

# Edit .env file with your local settings
```

**Essential `.env` variables:**

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-for-development-only
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (for local PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (use console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Optional: External Services (can be left empty for basic development)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
CURRENCY_API_KEY=
```

#### Frontend Configuration

```bash
# Create .env file in frontend directory
cd ../frontend
echo "REACT_APP_API_URL=http://localhost:8000" > .env
```

---

## Project Setup

### Option 1: Automated Setup (Recommended)

```bash
# From project root
python setup_dev.py

# This will:
# 1. Install all dependencies
# 2. Run database migrations
# 3. Create a superuser (optional)
# 4. Load initial data
# 5. Install frontend dependencies
```

### Option 2: Docker Setup

```bash
# From project root
docker-compose up -d

# This starts:
# - PostgreSQL database
# - Redis
# - Django backend
# - React frontend
# - Celery worker
# - Celery beat scheduler

# Check logs
docker-compose logs -f

# Access services:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/api/docs/
```

### Option 3: Manual Setup

#### Step 1: Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE expense_tracker_dev;
CREATE USER expense_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker_dev TO expense_user;
\q
```

#### Step 2: Backend Setup

```bash
cd backend

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (categories, currencies)
python manage.py loaddata fixtures/initial_data.json

# Collect static files
python manage.py collectstatic --noinput

# Start development server
python manage.py runserver
```

#### Step 3: Frontend Setup

```bash
# In a new terminal
cd frontend

# Start development server
npm start
```

#### Step 4: Start Background Services

```bash
# Start Redis (if not running)
redis-server

# In a new terminal - Start Celery worker
cd backend
celery -A config worker -l info

# In another terminal - Start Celery beat (for scheduled tasks)
cd backend
celery -A config beat -l info
```

---

## Development Workflow

### 🔄 Daily Development Flow

```mermaid
graph LR
    A[Pull Latest] --> B[Create Feature Branch]
    B --> C[Write Code]
    C --> D[Write Tests]
    D --> E[Run Tests Locally]
    E --> F[Commit Changes]
    F --> G[Push to Remote]
    G --> H[Create Pull Request]
    H --> I[Code Review]
    I --> J[Merge to Main]
```

### Git Workflow

```bash
# Start your day
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/expense-analytics

# Make changes and commit
git add .
git commit -m "feat: add expense analytics dashboard"

# Push to remote
git push origin feature/expense-analytics

# Create Pull Request on GitHub
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(expenses): add receipt OCR processing"
git commit -m "fix(auth): resolve token refresh issue"
git commit -m "docs: update API documentation"
```

---

## Code Standards

### Python/Django Standards

#### Code Style
- Follow PEP 8
- Use Black for formatting
- Use isort for import sorting
- Maximum line length: 88 characters

```bash
# Format code
black backend/
isort backend/

# Check code quality
flake8 backend/
pylint backend/apps/
```

#### Type Hints
```python
from typing import List, Optional, Dict
from decimal import Decimal

def calculate_split(
    amount: Decimal,
    participants: List[User],
    split_type: str = "equal"
) -> Dict[User, Decimal]:
    """Calculate expense split among participants."""
    pass
```

#### Django Best Practices
```python
# Good: Use select_related for foreign keys
expenses = Expense.objects.select_related('paid_by', 'category').all()

# Good: Use prefetch_related for many-to-many
groups = Group.objects.prefetch_related('members').all()

# Good: Use Q objects for complex queries
from django.db.models import Q
expenses = Expense.objects.filter(
    Q(paid_by=user) | Q(shares__user=user)
).distinct()
```

### TypeScript/React Standards

#### Code Style
- Use ESLint and Prettier
- Functional components with hooks
- TypeScript strict mode

```bash
# Format code
npm run format

# Lint code
npm run lint
```

#### Component Structure
```typescript
// Good: Typed functional component
interface ExpenseItemProps {
  expense: Expense;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  onEdit,
  isLoading = false
}) => {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### State Management
```typescript
// Good: Use Redux Toolkit
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.items.push(action.payload);
    }
  }
});
```

---

## Testing Guidelines

### Backend Testing

#### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.expenses

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report

# Run with pytest
pytest
pytest --cov=apps --cov-report=html
```

#### Writing Tests
```python
# tests/test_expenses.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.expenses.models import Expense
from decimal import Decimal

User = get_user_model()

class ExpenseModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_expense(self):
        expense = Expense.objects.create(
            title='Test Expense',
            amount=Decimal('100.00'),
            paid_by=self.user,
            expense_date=date.today()
        )
        self.assertEqual(expense.title, 'Test Expense')
        self.assertEqual(expense.amount, Decimal('100.00'))
```

### Frontend Testing

#### Running Tests
```bash
# Run tests in watch mode
npm test

# Run all tests once
npm test -- --watchAll=false

# Run with coverage
npm test -- --coverage
```

#### Writing Tests
```typescript
// ExpenseForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Expense' }
    });
    
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '100.00' }
    });
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Expense',
        amount: 100.00
      });
    });
  });
});
```

---

## Common Tasks

### 🗄️ Database Operations

```bash
# Make migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access Django shell
python manage.py shell

# Access database shell
python manage.py dbshell

# Reset database (WARNING: Deletes all data)
python manage.py flush
```

### 🔍 Debugging

#### Backend Debugging

```python
# Use Django Debug Toolbar (automatically enabled in DEBUG mode)
# Access at: http://localhost:8000/__debug__/

# Use ipdb for breakpoints
import ipdb; ipdb.set_trace()

# Use Django shell for testing
python manage.py shell
>>> from apps.expenses.models import Expense
>>> Expense.objects.all()
```

#### Frontend Debugging

```typescript
// Use React Developer Tools browser extension

// Console logging
console.log('Expense data:', expense);

// Use debugger statement
debugger;

// Redux DevTools (automatically enabled in development)
```

### 📦 Package Management

```bash
# Backend - Add new package
pip install package-name
pip freeze > requirements.txt

# Frontend - Add new package
npm install package-name
npm install --save-dev dev-package-name
```

### 🚀 API Testing

```bash
# Using curl
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Using httpie (install: pip install httpie)
http POST localhost:8000/api/auth/login/ \
  email=test@example.com \
  password=password

# Access API documentation
open http://localhost:8000/api/docs/
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Issue: Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready  # macOS/Linux
pg_ctl status  # Windows

# Start PostgreSQL
brew services start postgresql  # macOS with Homebrew
sudo service postgresql start  # Linux
pg_ctl start  # Windows
```

#### Issue: Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Start Redis
redis-server  # All platforms
brew services start redis  # macOS with Homebrew
```

#### Issue: Migration Conflicts

```bash
# Reset migrations (WARNING: Development only)
python manage.py migrate <app_name> zero
python manage.py makemigrations
python manage.py migrate

# Fake migrations if needed
python manage.py migrate --fake
```

#### Issue: Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Issue: CORS Errors

```python
# Check backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## Resources

### 📚 Documentation

#### Internal Documentation
- [Developer Guide](DEVELOPER_GUIDE.md) - Comprehensive architecture guide
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Database Schema](DATABASE_SCHEMA.md) - Database structure details
- [WARP Guide](../WARP.md) - Quick command reference

#### External Documentation
- [Django Documentation](https://docs.djangoproject.com/en/4.2/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Material-UI](https://mui.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 🎓 Learning Resources

#### Backend Development
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)
- [Django for APIs](https://djangoforapis.com/)
- [Test-Driven Development with Python](https://www.obeythetestinggoat.com/)

#### Frontend Development
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Redux Essentials](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [Testing React Components](https://testing-library.com/docs/react-testing-library/intro/)

### 🛠️ Development Tools

#### API Development
- [Postman](https://www.postman.com/) - API testing
- [Insomnia](https://insomnia.rest/) - API testing alternative
- [Swagger Editor](https://editor.swagger.io/) - API design

#### Database Tools
- [TablePlus](https://tableplus.com/) - Database GUI
- [DBeaver](https://dbeaver.io/) - Universal database tool
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL administration

#### Monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Frontend monitoring
- [New Relic](https://newrelic.com/) - Application performance monitoring

---

## Getting Help

### 💬 Communication Channels

#### Slack Channels
- `#dev-general` - General development discussions
- `#dev-backend` - Backend specific questions
- `#dev-frontend` - Frontend specific questions
- `#dev-help` - Get help with issues
- `#dev-standup` - Daily standup updates

#### Team Contacts

| Role | Name | Contact | Expertise |
|------|------|---------|-----------|
| Tech Lead | John Doe | john@example.com | Architecture, Code Reviews |
| Backend Lead | Jane Smith | jane@example.com | Django, API Design |
| Frontend Lead | Bob Wilson | bob@example.com | React, UI/UX |
| DevOps Lead | Alice Brown | alice@example.com | Infrastructure, CI/CD |

### 📝 Code Review Process

1. **Create Pull Request**
   - Write descriptive title and description
   - Link related issues
   - Add appropriate labels
   - Request reviews from relevant team members

2. **Review Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests are included and passing
   - [ ] Documentation is updated
   - [ ] No security vulnerabilities
   - [ ] Performance considerations addressed

3. **Approval Requirements**
   - At least 1 approval for regular PRs
   - 2 approvals for critical changes
   - Tech lead approval for architecture changes

### 🐛 Bug Reporting

When reporting bugs, include:

1. **Environment Information**
   - OS and version
   - Python/Node version
   - Browser (for frontend issues)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected behavior
   - Actual behavior

3. **Error Information**
   - Error messages
   - Stack traces
   - Screenshots if applicable

4. **Additional Context**
   - Recent changes
   - Related issues
   - Possible solutions

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable, add screenshots

## Environment
- OS: [e.g., macOS 12.0]
- Python: [e.g., 3.11.0]
- Node: [e.g., 18.12.0]
- Browser: [e.g., Chrome 108]

## Additional Context
Any other context about the problem
```

---

## Final Tips

### 🎯 Best Practices

1. **Always work in feature branches** - Never commit directly to main/develop
2. **Write tests for new features** - Aim for >80% code coverage
3. **Document your code** - Use docstrings and comments appropriately
4. **Review others' code** - Learn from teammates and share knowledge
5. **Ask questions** - No question is too small
6. **Keep dependencies updated** - Regular updates prevent security issues
7. **Use meaningful variable names** - Code should be self-documenting
8. **Optimize database queries** - Use select_related and prefetch_related
9. **Handle errors gracefully** - Always have error handling in place
10. **Security first** - Never commit secrets or sensitive data

### 🚀 Performance Tips

1. **Database**
   - Use database indexes for frequently queried fields
   - Implement pagination for large datasets
   - Use database connection pooling

2. **Backend**
   - Cache expensive computations with Redis
   - Use Celery for long-running tasks
   - Implement API rate limiting

3. **Frontend**
   - Lazy load components
   - Implement virtual scrolling for long lists
   - Use React.memo for expensive components
   - Optimize bundle size with code splitting

### 🔒 Security Reminders

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Both frontend and backend
3. **Use HTTPS** - Even in development when testing payments
4. **Keep dependencies updated** - Regular security updates
5. **Follow OWASP guidelines** - Prevent common vulnerabilities

---

## Welcome Aboard! 🎉

Congratulations on completing the onboarding process! You're now ready to start contributing to the Expense Tracker project.

**Your First Tasks:**
1. ✅ Set up your development environment
2. ✅ Run the application locally
3. ✅ Explore the codebase
4. ✅ Read the documentation
5. 🎯 Pick a "good first issue" from GitHub
6. 🚀 Make your first contribution!

**Remember:**
- Take your time to understand the codebase
- Don't hesitate to ask questions
- Code reviews are learning opportunities
- Have fun and happy coding!

---

*Last Updated: January 2024*
*Version: 1.0.0*

**Need help?** Reach out on Slack #dev-help or contact your team lead.
