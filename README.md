# Expense Tracker & Spend Analytics App

A comprehensive expense tracking and bill splitting application similar to Splitwise, built with Django REST Framework backend and React frontend.

## Features

### Core Features
- ✅ Individual and group expense tracking
- ✅ Bill splitting (equal, by shares, percentage, exact amounts)
- ✅ Multi-currency support with real-time exchange rates
- ✅ Expense categories and filtering
- ✅ Receipt attachment and OCR scanning
- ✅ Debt simplification algorithms
- ✅ Payment integration (PayPal, Stripe)
- ✅ Comprehensive analytics dashboard
- ✅ Recurring expenses management
- ✅ Notifications and reminders
- ✅ Offline mode with sync
- ✅ Data export (CSV, PDF)
- ✅ Activity feeds and comments

### 💰 Envelope Budgeting System (New!)
- ✅ Zero-based budgeting with monthly caps
- ✅ Wallet/Envelope management for different categories
- ✅ Sinking funds for long-term savings
- ✅ Rollover support for unused budget
- ✅ One-time "whammy" adjustments

### Technical Stack
- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT with role-based access control
- **UI Components**: Material-UI (MUI)
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **File Storage**: AWS S3 / Local storage
- **Task Queue**: Celery with Redis
- **Testing**: Pytest (backend), Jest + React Testing Library (frontend)

## Project Structure

```
expense_tracker_app/
├── backend/                    # Django backend
│   ├── config/                # Django settings and configuration
│   ├── apps/                  # Django applications
│   │   ├── authentication/   # User authentication and authorization
│   │   ├── expenses/         # Expense management
│   │   ├── groups/          # Group management
│   │   ├── payments/        # Payment processing
│   │   ├── analytics/       # Analytics and reporting
│   │   ├── notifications/   # Notification system
│   │   ├── budget/          # Envelope budgeting system
│   │   └── core/           # Core utilities and models
│   ├── media/              # User uploaded files
│   ├── static/             # Static files
│   ├── requirements.txt    # Python dependencies
│   └── manage.py          # Django management script
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store configuration
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   ├── package.json       # Node.js dependencies
│   └── tsconfig.json      # TypeScript configuration
├── docs/                   # Documentation
├── deployment/             # Deployment configurations
├── tests/                  # Integration tests
└── docker-compose.yml      # Docker configuration
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis (for Celery)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Development
```bash
# Start all services with Docker
docker-compose up -d

# Run tests
cd backend && python manage.py test
cd frontend && npm test
```

## API Documentation
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License
MIT License
