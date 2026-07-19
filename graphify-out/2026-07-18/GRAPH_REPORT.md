# Graph Report - Expense-Tracker-And-Analytics  (2026-07-15)

## Corpus Check
- 327 files · ~139,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2558 nodes · 4477 edges · 266 communities (196 shown, 70 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 845 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6e42d99`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User
- post_game_service.py
- api.ts
- localeCurrency.ts
- AdminShell.tsx
- Notification
- useAppSelector
- Currency
- AppRoutes.tsx
- ExpenseShare
- WalletAllocation
- Entity
- ExpenseViewSet
- Expense
- TimeStampedModel
- 🔍 Comprehensive Codebase Audit Report
- groupSlice.ts
- views.py
- views.py
- ExpenseForm.tsx
- MonthlyBudget
- models.py
- OfflineService
- ExpenseService
- 🚀 Expense Tracker API Documentation
- Security Setup Guide
- ExpenseSerializer
- Settlement
- AppContext.tsx
- GroupViewSet
- Expense API
- Group API
- 🗄️ Database Schema Documentation
- PostGameAnalyticsPage.tsx
- 📚 Expense Tracker Developer Guide
- Dashboard.tsx
- compilerOptions
- GroupInvitation
- Authentication API
- home_dashboard.py
- Payment API
- system_logging.py
- dependencies
- DebtSimplifier
- PaymentRequest
- GeneratedReport
- SettlementSerializer
- Expense Tracker & Spend Analytics App
- Group
- DashboardLayout.tsx
- index.ts
- setup_dev.py
- README.md
- Analytics API
- MorePage.tsx
- Notification API
- App.tsx
- ._seed
- MonthlyBudgetViewSet
- CategoryViewSet
- SyncSecurityTests
- README.md
- Budget API
- security_views.py
- .get
- 1.1 Database Design
- 2.3 Concurrency & Race Conditions
- 🛠️ Development Tools
- Project tracker
- authSlice.ts
- ExpenseFilterMixin
- .create_notification
- Write tests
- Performance Considerations
- 🚀 Developer Onboarding Guide
- Getting started
- UserViewSetSecurityTests
- views.py
- GroupMembershipSerializer
- GroupSerializer
- .save
- Verify and fix
- User Management API
- Expense Tracker & Analytics — 360° Architecture Deep-Dive Report
- 4. Uncharted UX Gaps & Logical Flaws
- Environment Setup
- Python/Django Standards
- development
- ledgerCoreTheme.ts
- exceptions.py
- RecurringExpenseViewSet
- Frontend map
- API overview
- 3.1 Financial Math Risks
- Core Database Tables
- Common Issues and Solutions
- Option 3: Manual Setup
- Data model
- package.json
- manifest.json
- Available Scripts
- AGENTS.md — LedgerCore (Expense Tracker & Analytics)
- SettlementIntegrityTests
- Permissions checklist
- Real-time Events
- 3.2 Authorization Flaws
- 5. The "Level-Up" Roadmap
- Core Domain
- Security Measures
- API Architecture
- Testing Strategy
- Common Tasks
- Backend Testing
- Glossary
- service-worker.js
- .accept
- GroupInvitationSerializer
- Architecture
- Runbook (local)
- Settlements
- Architecture
- Budget Domain
- Expense Domain
- Frontend Architecture
- Development Workflow
- Getting Help
- Frontend
- Command
- Command
- Expense Tracker / LedgerCore development
- Offline sync
- Auth and roles
- Budget envelopes
- Testing
- Verification
- Request & Response Format
- 1.3 State Management (Frontend)
- Analytics Domain
- Group Domain
- Notification Domain
- Payment Domain
- Deployment Architecture
- Key flows
- LedgerCore documentation
- scripts
- Command
- BudgetConfig
- ExpensesConfig
- Add API endpoint
- Debug runtime
- Django migrate
- domain-glossary.md
- Offline sync
- Filtering & Sorting
- Migration Strategy
- Final Tips
- Development Workflow
- lazyWithRetry.ts
- AnalyticsConfig
- AuthenticationConfig
- CoreConfig
- EnterpriseConfig
- GroupsConfig
- NotificationsConfig
- PaymentsConfig
- PaymentWebhook
- urls.py
- main
- Add app page
- API map
- Authentication
- react
- 0001_initial.py
- 0002_initial.py
- 0001_initial.py
- 0003_ledgercore_security_profile.py
- 0004_user_monthly_income.py
- 0001_initial.py
- 0002_fixedcost.py
- 0003_savingsgoal.py
- 0001_initial.py
- 0002_systemlog.py
- .convert_from_usd
- .convert_to_usd
- .get_value
- .post
- .popular
- 0001_initial.py
- 0001_initial.py
- 0002_alter_expense_attachments_alter_expense_ocr_data_and_more.py
- 0003_add_user_category.py
- 0004_add_partial_index_unsettled_shares.py
- 0005_expense_version.py
- 0001_initial.py
- 0001_initial.py
- 0002_budget_notification_types.py
- 0003_add_partial_index_unread_notifications.py
- 0001_initial.py
- 0002_paymentrequest.py
- expense_settlements
- transaction_history
- asgi.py
- settings.py
- wsgi.py
- verify-on-stop.md
- date-fns
- @emotion/styled
- @mui/material
- @mui/x-date-pickers
- react-dom
- react-router-dom
- react-scripts
- recharts
- @reduxjs/toolkit
- @testing-library/dom
- @testing-library/jest-dom
- @testing-library/react
- @types/dompurify
- @types/jest
- @types/react
- @types/react-dom
- typescript
- theme

## God Nodes (most connected - your core abstractions)
1. `TimeStampedModel` - 46 edges
2. `User` - 38 edges
3. `Expense` - 35 edges
4. `UserProfile` - 34 edges
5. `EmailVerification` - 34 edges
6. `SimpleUserSerializer` - 34 edges
7. `MonthlyBudget` - 34 edges
8. `UserFriendship` - 33 edges
9. `Wallet` - 32 edges
10. `WalletCategory` - 32 edges

## Surprising Connections (you probably didn't know these)
- `_budget_vs_actual()` --calls--> `ensure_monthly_budget()`  [INFERRED]
  backend/apps/analytics/post_game_service.py → backend/apps/budget/services.py
- `_budget_vs_actual()` --calls--> `get_spent_for_wallet_allocation()`  [INFERRED]
  backend/apps/analytics/post_game_service.py → backend/apps/budget/services.py
- `GroupActivitySerializer` --uses--> `SimpleUserSerializer`  [INFERRED]
  backend/apps/groups/serializers.py → backend/apps/authentication/serializers.py
- `GroupBalanceSerializer` --uses--> `SimpleUserSerializer`  [INFERRED]
  backend/apps/groups/serializers.py → backend/apps/authentication/serializers.py
- `GroupCreateSerializer` --uses--> `SimpleUserSerializer`  [INFERRED]
  backend/apps/groups/serializers.py → backend/apps/authentication/serializers.py

## Import Cycles
- 1-file cycle: `backend/config/celery.py -> backend/config/celery.py`

## Communities (266 total, 70 thin omitted)

### Community 0 - "User"
Cohesion: 0.06
Nodes (73): AbstractUser, AnonRateThrottle, EmailVerification, Meta, Extended user profile information, Model to handle friendships between users, Custom User model extending Django's AbstractUser, Model to handle email verification tokens (+65 more)

### Community 1 - "post_game_service.py"
Cohesion: 0.05
Nodes (48): notify_critical_insights(), Create in-app notifications for critical post-game insights., Dedupe: one notification per insight_key per 24h., generate_rule_insights(), merge_insights(), _prev_month(), Rule-based post-game insights., Dedupe by insight_key, rank by severity. (+40 more)

### Community 2 - "api.ts"
Cohesion: 0.06
Nodes (33): RecurringExpense, RecurringExpensesList(), LcCard(), ConflictItem, HomePage(), PeoplePage(), SettlementReportsPage(), Budget() (+25 more)

### Community 3 - "localeCurrency.ts"
Cohesion: 0.09
Nodes (39): currencyFromQuery(), useLandingLocale(), VALID_CURRENCIES, buildLinkPath(), CashFlowSankey(), CashFlowSankeyProps, HeroDashboardPreview(), HeroDashboardPreviewProps (+31 more)

### Community 4 - "AdminShell.tsx"
Cohesion: 0.08
Nodes (35): statusColor, StatusDot(), AdminShell(), footerItems, mobileNav, sidebarItems, AppSidebar(), AppSidebarProps (+27 more)

### Community 5 - "Notification"
Cohesion: 0.06
Nodes (29): Meta, Notification, NotificationLog, NotificationPreference, NotificationTemplate, Model for user notifications, Mark notification as read, Mark notification as sent (+21 more)

### Community 6 - "useAppSelector"
Cohesion: 0.07
Nodes (33): ExpenseList(), ExpenseListProps, FinancialSettingsCard(), useAppContext(), useAppDispatch(), useAppSelector, AdminLedgerPage(), Expenses() (+25 more)

### Community 7 - "Currency"
Cohesion: 0.17
Nodes (31): Category, Country, Currency, Model for tags that can be applied to expenses, Model to store system-wide configuration settings, Model to store currency information, Model to store expense categories, Model to store country information (+23 more)

### Community 8 - "AppRoutes.tsx"
Cohesion: 0.05
Nodes (37): AddExpensePage, AdminAlertsPage, AdminAuditPage, AdminDashboard, AdminEntitiesPage, AdminExportPage, AdminLedgerPage, AdminReportsPage (+29 more)

### Community 9 - "ExpenseShare"
Cohesion: 0.10
Nodes (26): ExpenseComment, ExpenseShare, Model representing a user's share of an expense, Check if this share is owed by the user (user didn't pay), Net amount (positive if owed to user, negative if owed by user), Model for managing recurring expenses, Get the next due date (alias for next_due_date field), Model for comments on expenses (+18 more)

### Community 10 - "WalletAllocation"
Cohesion: 0.13
Nodes (17): Per-month allocation for a wallet: limit (regular) or monthly contribution (sink, Assigns a system category to a wallet. Every category belongs to exactly one wal, WalletAllocation, WalletCategory, UserCategorySerializer, WalletAdjustmentSerializer, WalletAllocationSerializer, WalletAllocationWriteSerializer (+9 more)

### Community 11 - "Entity"
Cohesion: 0.16
Nodes (14): AuditEvent, Entity, ExportJob, Meta, IsEnterpriseAdmin, AuditEventSerializer, EntitySerializer, ExportJobSerializer (+6 more)

### Community 12 - "ExpenseViewSet"
Cohesion: 0.07
Nodes (18): Convert Decimal fields to float for JSON serialization, Lightweight serializer for list endpoints — excludes nested shares,     comments, SimpleExpenseSerializer, ExpenseViewSet, Mark expense as settled, Split expense equally among selected users., Split expense by specific amounts., Split expense by percentages. (+10 more)

### Community 13 - "Expense"
Cohesion: 0.08
Nodes (17): Expense Filter Mixin Provides reusable filtering logic for expense queries, Expense, Meta, Validate receipt file size (max 5MB), Create expense shares based on split type, Validate receipt file extension, Create shares for group expenses based on split type., Get total amount of all shares (+9 more)

### Community 14 - "TimeStampedModel"
Cohesion: 0.09
Nodes (18): Model to track user devices for notifications, UserDevice, ActivityLog, Meta, Model to log user activities for audit trail, Unified audit / health log for admin monitoring (HTTP, auth, user actions)., Abstract base class that provides created_at and updated_at fields, Get full category name including parent (+10 more)

### Community 15 - "🔍 Comprehensive Codebase Audit Report"
Cohesion: 0.06
Nodes (30): 1.1 SQL Injection Risk in Query Parameters, 1.2 XSS Vulnerability in User-Generated Content, 1.3 Missing Authorization Checks, 1.4 JWT Token Storage in localStorage, 1.5 Missing Rate Limiting on Authentication Endpoints, 1.6 Missing Input Validation on File Uploads, 1. 🔴 CRITICAL SECURITY VULNERABILITIES, 2.1 N+1 Query Problem in ExpenseViewSet (+22 more)

### Community 16 - "groupSlice.ts"
Cohesion: 0.16
Nodes (26): Group, GROUP_TYPES, GroupMember, Groups(), SearchedUser, Groups(), fetchCurrencies, addMember (+18 more)

### Community 17 - "views.py"
Cohesion: 0.13
Nodes (24): generate_csv_export(), generate_pdf_export(), Utility functions for exporting expense data, Generate CSV export of expenses, Generate PDF export of expenses, smart_insights(), spending_flow(), spending_intensity() (+16 more)

### Community 18 - "views.py"
Cohesion: 0.13
Nodes (24): apply_rollover(), check_wallet_alerts(), ensure_monthly_budget(), ensure_sinking_contribution(), get_adjustments_total(), get_spent_for_wallet_allocation(), get_wallet_for_expense(), process_expense_deduction() (+16 more)

### Community 19 - "ExpenseForm.tsx"
Cohesion: 0.13
Nodes (19): dompurify, dompurify, ExpenseForm(), ExpenseFormProps, ExpenseShare, GroupMember, ExpenseDetail(), expensesAPI (+11 more)

### Community 20 - "MonthlyBudget"
Cohesion: 0.16
Nodes (19): MonthlyBudgetAdmin, UserCategoryAdmin, WalletAdjustmentAdmin, WalletAdmin, WalletAllocationAdmin, WalletCategoryAdmin, MonthlyBudget, Total monthly budget cap for a user (year/month). (+11 more)

### Community 21 - "models.py"
Cohesion: 0.13
Nodes (14): FixedCostSerializer, FixedCostViewSet, Meta, FixedCost, Meta, Budget (Envelope) models: Total Budget > Wallets > Categories., Recurring bill reminders (Netflix, utilities, etc.)., User-defined savings target for post-game analytics. (+6 more)

### Community 23 - "ExpenseService"
Cohesion: 0.12
Nodes (14): ExpenseService, Run after an expense is deleted: update group total if it was a group expense., Business logic for expense create/update/delete., Create equal shares for all active group members.          Uses ROUND_DOWN per s, Recalculate and save group's total_expenses., Send notifications for a new expense. Returns list of created notifications., Send notifications for an updated expense. Returns list of created notifications, Run after an expense is created: equal shares if group expense without shares_da (+6 more)

### Community 24 - "🚀 Expense Tracker API Documentation"
Cohesion: 0.08
Nodes (26): API Changelog, API Endpoints, API Versioning, Base URL & Versioning, Base URLs, Error Codes, Error Handling, 🚀 Expense Tracker API Documentation (+18 more)

### Community 25 - "Security Setup Guide"
Cohesion: 0.08
Nodes (25): Additional Resources, API & Auth, AWS/EC2, AWS S3 (Optional), Backend Security, Database & Data, Deployment Security, Docker (+17 more)

### Community 26 - "ExpenseSerializer"
Cohesion: 0.11
Nodes (11): ExpenseSerializer, Map 'date' to 'expense_date' before validation and handle ID conversions, Return paid_by as created_by for backward compatibility, Return user_category for envelope budgeting (custom category in a wallet)., Additional validation - conversion happens in to_internal_value and create metho, _accessible_expense_qs(), _get_accessible_expense(), Expenses the user may sync: payer, share participant, or active group member. (+3 more)

### Community 27 - "Settlement"
Cohesion: 0.18
Nodes (15): Meta, Payment, PaymentMethod, Model to store user payment methods, Check if settlement is confirmed by both parties, Model representing individual payments made through the platform, Model representing a settlement between users, Settlement (+7 more)

### Community 28 - "AppContext.tsx"
Cohesion: 0.10
Nodes (16): AppContext, AppContextType, AppProvider(), Expense, Group, Member, mockMembers, Notification (+8 more)

### Community 29 - "GroupViewSet"
Cohesion: 0.09
Nodes (11): GroupViewSet, Join a group using invite code, ViewSet for managing groups., Get group statistics (single-query aggregates)., Get group member balances.          Replaced nested Python loops (expense → shar, Ensure request is in serializer context, Mark all group expenses as settled, Search for users to add to a group (+3 more)

### Community 30 - "Expense API"
Cohesion: 0.09
Nodes (23): 1. List Expenses, 2. Create Expense, 3. Get Expense Details, 4. Update Expense, 5. Delete Expense, 6. Update Expense Split, 7. Add Expense Comment, 8. Upload Receipt (+15 more)

### Community 31 - "Group API"
Cohesion: 0.09
Nodes (23): 1. List Groups, 2. Create Group, 3. Get Group Details, 4. Update Group, 5. Get Group Members, 6. Invite Member, 7. Leave Group, 8. Get Group Balances (+15 more)

### Community 32 - "🗄️ Database Schema Documentation"
Cohesion: 0.09
Nodes (23): Authentication Domain, Check Constraints, Custom Types, Data Types & Constraints, Database Design Principles, Database Maintenance, 🗄️ Database Schema Documentation, Entity Relationship Diagram (+15 more)

### Community 33 - "PostGameAnalyticsPage.tsx"
Cohesion: 0.12
Nodes (17): BudgetVsActual(), Row, CashFlowCard(), CashFlowCardProps, intensityColor(), IntensityHeatmap(), IntensityHeatmapProps, iconFor() (+9 more)

### Community 34 - "📚 Expense Tracker Developer Guide"
Cohesion: 0.09
Nodes (22): Appendix, Application Monitoring, Backend Stack, Backend Structure, Component Interaction Flow, DevOps & Tools, Environment Variables, 📚 Expense Tracker Developer Guide (+14 more)

### Community 35 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (16): Analytics(), COLORS, Dashboard(), formatLocalDate(), QuickActionProps, StatCardProps, analyticsSlice, AnalyticsState (+8 more)

### Community 36 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+13 more)

### Community 37 - "GroupInvitation"
Cohesion: 0.18
Nodes (16): GroupActivity, GroupInvitation, GroupMembership, Meta, Model representing membership of a user in a group, Model for tracking group invitations sent via email/phone, Model to track group activities for feed, GroupBalanceSerializer (+8 more)

### Community 38 - "Authentication API"
Cohesion: 0.11
Nodes (19): 1. User Registration, 2. User Login, 3. Token Refresh, 4. Logout, 5. Password Reset Request, 6. Password Reset Confirm, Authentication API, Request Body (+11 more)

### Community 39 - "home_dashboard.py"
Cohesion: 0.21
Nodes (15): _build_balances(), _build_group_summaries(), _build_recent_expenses(), dashboard_summary(), Consolidated dashboard endpoint.  Returns user balances, recent expenses, grou, Return the most recent expenses the user is involved in., Return lightweight summaries for every active group the user belongs to., Aggregated dashboard payload — one request replaces five.      Returns: (+7 more)

### Community 40 - "Payment API"
Cohesion: 0.11
Nodes (18): 1. List Payment Methods, 2. Add Payment Method, 3. List Settlements, 4. Create Settlement, 5. Confirm Settlement, 6. Process Payment, Payment API, Query Parameters (+10 more)

### Community 41 - "system_logging.py"
Cohesion: 0.17
Nodes (13): Any, APILoggingMiddleware, API request logging: database (admin UI) + console trace (dev monitoring)., Record API traffic to SystemLog and console., _client_ip(), _mirror_console(), Persist structured logs for admin monitoring + mirror to console., Print to terminal so devs can tail backend activity alongside the admin UI. (+5 more)

### Community 42 - "dependencies"
Cohesion: 0.12
Nodes (17): axios, @date-io/date-fns, @emotion/react, dependencies, axios, @date-io/date-fns, @emotion/react, @mui/icons-material (+9 more)

### Community 43 - "DebtSimplifier"
Cohesion: 0.17
Nodes (12): DebtSimplifier, Decimal, Advanced debt simplification algorithm Implements cycle detection and minimizat, Advanced debt simplification using cycle detection and transaction minimization, Minimize the number of transactions needed to settle all debts         Uses a c, Merge transactions to reduce total count         Example: A->B $10, B->C $10 be, Simplify debts by finding cycles and minimizing transactions, Find cycles in the debt graph using DFS                  Args:             ba (+4 more)

### Community 44 - "PaymentRequest"
Cohesion: 0.16
Nodes (7): PaymentRequest, User-reported payment awaiting payee approval., Meta, PaymentRequestSerializer, PaymentRequestViewSet, Approve payment request atomically to prevent double-settlement., settlement_reports()

### Community 45 - "GeneratedReport"
Cohesion: 0.12
Nodes (10): ExpenseAnalytics, GeneratedReport, Meta, Model for storing pre-calculated expense analytics, Model for storing custom report templates, Model for tracking generated reports, Check if report has expired, Model for tracking user spending patterns and habits (+2 more)

### Community 46 - "SettlementSerializer"
Cohesion: 0.15
Nodes (9): Validate settlement data, SettlementSerializer, create_settlement(), Reject/dispute a settlement, ViewSet for managing settlements, Create a new settlement, Confirm a settlement (atomic to prevent double-confirm races)., Mark settlement as completed (atomic to prevent double-complete). (+1 more)

### Community 47 - "Expense Tracker & Spend Analytics App"
Cohesion: 0.12
Nodes (15): API Documentation, Backend Setup, Contributing, Core Features, Development, 💰 Envelope Budgeting System (New!), Expense Tracker & Spend Analytics App, Features (+7 more)

### Community 48 - "Group"
Cohesion: 0.16
Nodes (7): Group, Calculate balances for all group members, Model representing a group for shared expenses, Generate a unique invite code for the group, Get all admin members of the group, Get all active members of the group, Update the denormalized total_expenses field

### Community 49 - "DashboardLayout.tsx"
Cohesion: 0.19
Nodes (10): resetAuthCheckGuard(), ForgotPasswordForm(), bottomMenuItems, DashboardLayout(), DashboardLayoutProps, MenuItem, menuItems, Notification (+2 more)

### Community 50 - "index.ts"
Cohesion: 0.22
Nodes (11): LoginForm(), LoginFormProps, TODO: Implement social login, TODO: Implement social login, RegisterForm(), RegisterFormProps, loginUser, registerUser (+3 more)

### Community 51 - "setup_dev.py"
Cohesion: 0.39
Nodes (14): check_prerequisite(), check_prerequisites(), create_env_file(), heading(), install_python_deps(), main(), Run a shell command; returns True on success., Abort early if a required tool is missing. (+6 more)

### Community 52 - "README.md"
Cohesion: 0.26
Nodes (4): Do not, Known pitfalls, Agent knowledge base (LedgerCore), Human docs (diagrams)

### Community 53 - "Analytics API"
Cohesion: 0.14
Nodes (14): 1. Get Expense Summary, 2. Get Spending Trends, 3. Get Category Breakdown, 4. Generate Report, 5. Get Report Status, Analytics API, Query Parameters, Query Parameters (+6 more)

### Community 54 - "MorePage.tsx"
Cohesion: 0.23
Nodes (10): links, MorePage(), SearchAuditPage(), AdminGuard(), AuthGuard(), PublicGuard(), User, ADMIN_ROLES (+2 more)

### Community 55 - "Notification API"
Cohesion: 0.15
Nodes (13): 1. List Notifications, 2. Mark Notification as Read, 3. Mark All as Read, 4. Get Notification Preferences, 5. Update Notification Preferences, Notification API, Query Parameters, Request Body (+5 more)

### Community 56 - "App.tsx"
Cohesion: 0.22
Nodes (9): AuthBootstrap(), isPublicPath(), PUBLIC_PATH_PREFIXES, skipLinkFocusStyles, skipLinkStyles, shouldDispatchAuthCheck(), AppRoutes(), registerSessionExpiredHandler() (+1 more)

### Community 57 - "._seed"
Cohesion: 0.29
Nodes (7): Command, BaseCommand, date, _random_day(), Seed realistic expenses, budgets, and goals for post-game / ML analytics testing, _shift_month(), Random

### Community 58 - "MonthlyBudgetViewSet"
Cohesion: 0.23
Nodes (5): MonthlyBudgetSerializer, MonthlyBudgetWriteSerializer, MonthlyBudgetViewSet, Get or create current month budget., Get budget for year/month. Query params: year, month.

### Community 59 - "CategoryViewSet"
Cohesion: 0.20
Nodes (5): CategorySerializer, Category serializer with hierarchical support, CategoryViewSet, Category management viewset, Get default categories

### Community 60 - "SyncSecurityTests"
Cohesion: 0.18
Nodes (3): TestCase, RecurringProcessAllTests, SyncSecurityTests

### Community 62 - "Budget API"
Cohesion: 0.17
Nodes (12): 1. List Wallets, 2. Create Wallet, 3. Get Monthly Budget, 4. Create/Update Allocation, 5. Add Wallet Adjustment, Budget API, Query Parameters, Request Body (+4 more)

### Community 63 - "security_views.py"
Cohesion: 0.27
Nodes (7): _get_profile(), Verify app-lock PIN for the authenticated user only.      Uses profile-local f, security_settings(), set_app_lock_pin(), totp_setup(), totp_verify(), verify_app_lock_pin()

### Community 64 - ".get"
Cohesion: 0.22
Nodes (4): List categories — public endpoint, server-side cache only., Get latest currency exchange rates, List currencies — public endpoint, server-side cache only., Convert between currencies

### Community 65 - "1.1 Database Design"
Cohesion: 0.18
Nodes (11): 1.1 Database Design, 1.2 API Design, 1. Architectural Fallbacks & Scalability Bottlenecks, CRITICAL: SQLite in Production Path, Denormalization Risks, Hardcoded Currency, Inconsistent Response Shapes, Missing Indexes for Common Query Patterns (+3 more)

### Community 66 - "2.3 Concurrency & Race Conditions"
Cohesion: 0.18
Nodes (11): 2.1 Code Testability, 2.2 CI/CD & Automation, 2.3 Concurrency & Race Conditions, 2. System Reliability & Testability, CRITICAL: Settlement Double-Spend, Expense Share Creation During Split Update, Group Balance Settlement Race, Model `save()` with Side Effects (+3 more)

### Community 67 - "🛠️ Development Tools"
Cohesion: 0.18
Nodes (11): API Development, Backend Development, Database Tools, 🛠️ Development Tools, 📚 Documentation, External Documentation, Frontend Development, Internal Documentation (+3 more)

### Community 68 - "Project tracker"
Cohesion: 0.18
Nodes (10): 2025-09-07, 2025-09-08, 2026-01-26, 2026-02-01, 2026-02-04, 2026-03-03, 2026-05-24, 2026-07-11 (+2 more)

### Community 69 - "authSlice.ts"
Cohesion: 0.22
Nodes (7): authSlice, AuthState, fetchUser, initialState, login, register, tokenStorage

### Community 70 - "ExpenseFilterMixin"
Cohesion: 0.27
Nodes (5): ExpenseFilterMixin, Mixin for common expense filtering logic, Get base queryset for user's expenses with optimizations, Sanitize search term to prevent SQL injection, Apply common filters to expense queryset

### Community 71 - ".create_notification"
Cohesion: 0.20
Nodes (8): Create a notification for a user, quick_settle(), Quick settle - create settlement and optionally complete immediately.      When, Mark an expense share as settled.      Uses select_for_update() inside an atomic, Send a payment reminder to a user, Send a reminder to the payer, send_reminder(), settle_expense_share()

### Community 72 - "Write tests"
Cohesion: 0.20
Nodes (8): Backend API (sketch), Frontend slice (sketch), Test examples (LedgerCore patterns), Backend, Frontend, Policy, Then, Write tests

### Community 73 - "Performance Considerations"
Cohesion: 0.20
Nodes (10): 1. Code Splitting, 1. Query Optimization, 1. Redis Cache Layers, 2. Cache Implementation, 2. Database Connection Pooling, 2. Memoization, Caching Strategy, Database Optimization (+2 more)

### Community 74 - "🚀 Developer Onboarding Guide"
Cohesion: 0.20
Nodes (10): 🚀 Developer Onboarding Guide, Prerequisites, 🎯 Project Overview, 📋 Quick Facts, Recommended IDE/Tools, Required Software, Table of Contents, VSCode Extensions (+2 more)

### Community 75 - "Getting started"
Cohesion: 0.20
Nodes (10): Docker, Env and secrets, First-time data, Getting started, Manual alternative, Next reading, Prerequisites, Project map (+2 more)

### Community 77 - "views.py"
Cohesion: 0.22
Nodes (4): GroupActivitySerializer, Group activity serializer, Get recent group activity, # TODO: Send invitation email/SMS

### Community 78 - "GroupMembershipSerializer"
Cohesion: 0.22
Nodes (5): GroupMembershipSerializer, Group membership serializer, Change a member's role, Add an existing user as a member to the group, Notify group members when someone joins

### Community 79 - "GroupSerializer"
Cohesion: 0.22
Nodes (5): GroupSerializer, Calculate total expenses for the group dynamically, Get current user's role in the group, Get current user's balance in the group, Join a group using invite code

### Community 80 - ".save"
Cohesion: 0.25
Nodes (4): Confirm settlement by payer, Confirm settlement by payee, Mark settlement as confirmed by both parties, Mark settlement as completed and settle related expense shares.          When

### Community 81 - "Verify and fix"
Cohesion: 0.22
Nodes (7): Fail then fix, Pass, Verify-and-fix report examples, Loop (max 3), Project override, Report format, Verify and fix

### Community 82 - "User Management API"
Cohesion: 0.22
Nodes (9): 1. Get Current User Profile, 2. Update User Profile, 3. Upload Avatar, Request, Request Body, Response (200 OK), Response (200 OK), Response (200 OK) (+1 more)

### Community 83 - "Expense Tracker & Analytics — 360° Architecture Deep-Dive Report"
Cohesion: 0.22
Nodes (8): 6. Prioritized Action Plan, Appendix: File Reference, Expense Tracker & Analytics — 360° Architecture Deep-Dive Report, Phase 0 — Stop the Bleeding (Week 1-2), Phase 1 — Foundation (Week 3-6), Phase 2 — Scale (Week 7-12), Phase 3 — Enterprise (Week 13-20), Table of Contents

### Community 84 - "4. Uncharted UX Gaps & Logical Flaws"
Cohesion: 0.22
Nodes (9): 4.1 Dead-End User Flows, 4.2 Circular Debt Simplification Flaws, 4.3 Multi-Currency Blind Spots, 4.4 Soft Delete Inconsistency, 4.5 Hardcoded Monthly Budget, 4. Uncharted UX Gaps & Logical Flaws, Invitation System Inconsistency, Leaving a Group with Unsettled Debts (+1 more)

### Community 85 - "Environment Setup"
Cohesion: 0.22
Nodes (9): 1. Clone the Repository, 2. Set Up Python Environment, 3. Set Up Node Environment, 4. Configure Environment Variables, Backend Configuration, Environment Setup, Frontend Configuration, macOS/Linux (+1 more)

### Community 86 - "Python/Django Standards"
Cohesion: 0.22
Nodes (9): Code Standards, Code Style, Code Style, Component Structure, Django Best Practices, Python/Django Standards, State Management, Type Hints (+1 more)

### Community 87 - "development"
Cohesion: 0.22
Nodes (9): browserslist, development, production, >0.2%, last 1 chrome version, last 1 firefox version, last 1 safari version, not dead (+1 more)

### Community 88 - "ledgerCoreTheme.ts"
Cohesion: 0.36
Nodes (6): AuthLayout(), baseComponents, ledgerCoreAdminLightTheme, ledgerCoreColors, ledgerCoreDarkTheme, ledgerCoreLightAuthTheme

### Community 89 - "exceptions.py"
Cohesion: 0.32
Nodes (7): _build_error_response(), custom_exception_handler(), _normalize_detail(), Global exception handler for consistent JSON error responses across the API., Turn DRF exception detail (list/dict) into a single message string., Return a consistent JSON error response., Custom exception handler: DRF exceptions get normalized JSON;     unhandled exc

### Community 90 - "RecurringExpenseViewSet"
Cohesion: 0.25
Nodes (4): ViewSet for managing recurring expenses., Pause a recurring expense, Resume a recurring expense, RecurringExpenseViewSet

### Community 91 - "Frontend map"
Cohesion: 0.25
Nodes (8): Adding a page, API client, Entry, Frontend map, Key `/app` routes, Shells (`frontend/src/layout/`), State, Themes

### Community 92 - "API overview"
Cohesion: 0.25
Nodes (8): API overview, Auth, Base URL, Client convention, Curated non-CRUD flows, Live reference (source of truth), Prefix map, Response shape

### Community 93 - "3.1 Financial Math Risks"
Cohesion: 0.25
Nodes (8): 3.1 Financial Math Risks, 3.3 Data Integrity, 3. Security & Data Integrity, Decimal-to-Float Conversion, Equal Split Rounding Drift, No Database Constraints on Financial Invariants, Orphaned Records on Cascade Delete, Zero-Amount Share Acceptance

### Community 94 - "Core Database Tables"
Cohesion: 0.25
Nodes (8): Authentication Domain, Core Database Tables, Database Architecture, Database Indexing Strategy, Entity Relationship Diagram, Expense Domain, Group Domain, Payment Domain

### Community 95 - "Common Issues and Solutions"
Cohesion: 0.25
Nodes (8): Common Issues and Solutions, Issue: CORS Errors, Issue: Database Connection Error, Issue: Migration Conflicts, Issue: Node Modules Issues, Issue: Port Already in Use, Issue: Redis Connection Error, Troubleshooting

### Community 96 - "Option 3: Manual Setup"
Cohesion: 0.25
Nodes (8): Option 1: Automated Setup (Recommended), Option 2: Docker Setup, Option 3: Manual Setup, Project Setup, Step 1: Database Setup, Step 2: Backend Setup, Step 3: Frontend Setup, Step 4: Start Background Services

### Community 97 - "Data model"
Cohesion: 0.25
Nodes (8): Analytics and notifications (summary), Auth and core, Budget envelopes, Data model, Enterprise, Expenses, Groups (UI: Squads), Payments and settlements

### Community 98 - "package.json"
Cohesion: 0.25
Nodes (7): eslintConfig, extends, name, private, version, react-app, react-app/jest

### Community 99 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 100 - "Available Scripts"
Cohesion: 0.25
Nodes (7): Available Scripts, Getting Started with Create React App, Learn More, `npm run build`, `npm run eject`, `npm start`, `npm test`

### Community 101 - "AGENTS.md — LedgerCore (Expense Tracker & Analytics)"
Cohesion: 0.29
Nodes (7): AGENTS.md — LedgerCore (Expense Tracker & Analytics), Hard policies, Key paths, Product, Read first, Skills to use, UI zones

### Community 103 - "Permissions checklist"
Cohesion: 0.29
Nodes (7): Concurrency (sensitive mutations), Input validation, Permissions checklist, Privilege and identity fields, Queryset rules of thumb, Role matrix (SPA), Tests required

### Community 104 - "Real-time Events"
Cohesion: 0.29
Nodes (7): Authentication, Connection, Expense Updates, Group Activity, Payment Updates, Real-time Events, WebSocket Events

### Community 105 - "3.2 Authorization Flaws"
Cohesion: 0.29
Nodes (7): 3.2 Authorization Flaws, CRITICAL: IDOR in Expense Splitting, Debug Information Exposure, IDOR in Expense Share Settlement, JWT Token in SessionStorage, No Rate Limiting on Reminders, Unprotected Bulk Settlement

### Community 106 - "5. The "Level-Up" Roadmap"
Cohesion: 0.29
Nodes (7): 5.1 Event-Driven Architecture, 5.2 Real-Time Capabilities, 5.3 Advanced Analytics & Predictive Insights, 5. The "Level-Up" Roadmap, Data Points to Track, Django Channels for Live Updates, Where to Introduce Celery/Redis

### Community 107 - "Core Domain"
Cohesion: 0.29
Nodes (7): Core Domain, 📊 Table: `activity_logs`, 📊 Table: `categories`, 📊 Table: `countries`, 📊 Table: `currencies`, 📊 Table: `system_configurations`, 📊 Table: `tags`

### Community 108 - "Security Measures"
Cohesion: 0.29
Nodes (7): 1. Authentication & Authorization, 2. Data Protection, 3. Input Validation & Sanitization, 4. Security Headers, Authentication Flow, Authentication & Security, Security Measures

### Community 109 - "API Architecture"
Cohesion: 0.29
Nodes (7): API Architecture, API Endpoint Structure, API Request/Response Format, Error Response Format, RESTful API Design Principles, Standard Request Format, Standard Response Format

### Community 110 - "Testing Strategy"
Cohesion: 0.29
Nodes (7): Backend Testing, Component Tests, Frontend Testing, Integration Tests, Testing Pyramid, Testing Strategy, Unit Tests

### Community 111 - "Common Tasks"
Cohesion: 0.29
Nodes (7): 🚀 API Testing, Backend Debugging, Common Tasks, 🗄️ Database Operations, 🔍 Debugging, Frontend Debugging, 📦 Package Management

### Community 112 - "Backend Testing"
Cohesion: 0.29
Nodes (7): Backend Testing, Frontend Testing, Running Tests, Running Tests, Testing Guidelines, Writing Tests, Writing Tests

### Community 113 - "Glossary"
Cohesion: 0.29
Nodes (7): Analytics and ops, Budget, Glossary, Money and splitting, People and access, Product, Stack shorthand

### Community 114 - "service-worker.js"
Cohesion: 0.48
Nodes (6): API_ROUTES, getPendingExpenses(), openDB(), removePendingExpense(), syncExpenses(), urlsToCache

### Community 115 - ".accept"
Cohesion: 0.33
Nodes (3): Accept group invitation, Check if invitation is still valid, Accept the invitation

### Community 117 - "Architecture"
Cohesion: 0.33
Nodes (6): Architecture, Backend apps (`backend/apps/`), Base model patterns, Frontend zones, Request flow, Stack

### Community 118 - "Runbook (local)"
Cohesion: 0.33
Nodes (5): Env, First-time setup, Runbook (local), URLs, Useful commands

### Community 119 - "Settlements"
Cohesion: 0.33
Nodes (5): Agent rules, Frontend, Logic, Models, Settlements

### Community 120 - "Architecture"
Cohesion: 0.33
Nodes (6): Architecture, Backend apps → API prefixes, Docker Compose, Frontend zones (summary), Request path, System context

### Community 121 - "Budget Domain"
Cohesion: 0.33
Nodes (6): Budget Domain, 📊 Table: `budget_monthly_budgets`, 📊 Table: `budget_user_categories`, 📊 Table: `budget_wallet_adjustments`, 📊 Table: `budget_wallet_allocations`, 📊 Table: `budget_wallets`

### Community 122 - "Expense Domain"
Cohesion: 0.33
Nodes (6): Expense Domain, 📊 Table: `expense_comments`, 📊 Table: `expense_shares`, 📊 Table: `expense_tags`, 📊 Table: `expenses`, 📊 Table: `recurring_expenses`

### Community 123 - "Frontend Architecture"
Cohesion: 0.33
Nodes (6): 1. Container/Presentational Pattern, 2. Custom Hooks Pattern, Component Architecture, Component Design Patterns, Frontend Architecture, State Management with Redux

### Community 124 - "Development Workflow"
Cohesion: 0.33
Nodes (6): Code Style Guidelines, Development Process, Development Workflow, Git Workflow, Python/Django, TypeScript/React

### Community 125 - "Getting Help"
Cohesion: 0.33
Nodes (6): 🐛 Bug Reporting, 📝 Code Review Process, 💬 Communication Channels, Getting Help, Slack Channels, Team Contacts

### Community 126 - "Frontend"
Cohesion: 0.33
Nodes (6): Auth bootstrap, Frontend, Layout building blocks, State and API client, Themes, Three shells

### Community 127 - "Command"
Cohesion: 0.40
Nodes (3): Command, BaseCommand, Management command to seed default categories

### Community 128 - "Command"
Cohesion: 0.40
Nodes (3): Command, BaseCommand, Management command to seed default currencies

### Community 129 - "Expense Tracker / LedgerCore development"
Cohesion: 0.40
Nodes (4): Before coding, Checklist, Expense Tracker / LedgerCore development, Pointers

### Community 130 - "Offline sync"
Cohesion: 0.40
Nodes (4): Checklist, Critical invariants, Offline sync, Read first

### Community 131 - "Auth and roles"
Cohesion: 0.40
Nodes (4): Admin access, Auth and roles, Backend, Frontend session

### Community 132 - "Budget envelopes"
Cohesion: 0.40
Nodes (4): Agent rules, API / UI, Budget envelopes, Models (`backend/apps/budget/models.py`)

### Community 133 - "Testing"
Cohesion: 0.40
Nodes (5): Commands, Policy, Testing, What to cover for new behavior, Where tests live

### Community 134 - "Verification"
Cohesion: 0.40
Nodes (5): Command matrix, Done means, Parallel review (after implement), Severity policy, Verification

### Community 135 - "Request & Response Format"
Cohesion: 0.40
Nodes (5): Error Response, Request & Response Format, Standard Request Headers, Standard Response Structure, Success Response

### Community 136 - "1.3 State Management (Frontend)"
Cohesion: 0.40
Nodes (5): 1.3 State Management (Frontend), Dual State Systems in Conflict, No Request Deduplication or Caching, Token Storage Inconsistency, Unnecessary Re-Renders

### Community 137 - "Analytics Domain"
Cohesion: 0.40
Nodes (5): Analytics Domain, 📊 Table: `expense_analytics`, 📊 Table: `generated_reports`, 📊 Table: `report_templates`, 📊 Table: `user_spending_patterns`

### Community 138 - "Group Domain"
Cohesion: 0.40
Nodes (5): Group Domain, 📊 Table: `group_activities`, 📊 Table: `group_invitations`, 📊 Table: `group_memberships`, 📊 Table: `groups`

### Community 139 - "Notification Domain"
Cohesion: 0.40
Nodes (5): Notification Domain, 📊 Table: `notification_logs`, 📊 Table: `notification_preferences`, 📊 Table: `notification_templates`, 📊 Table: `notifications`

### Community 140 - "Payment Domain"
Cohesion: 0.40
Nodes (5): Payment Domain, 📊 Table: `payment_methods`, 📊 Table: `payment_webhooks`, 📊 Table: `payments`, 📊 Table: `settlements`

### Community 141 - "Deployment Architecture"
Cohesion: 0.40
Nodes (5): 1. Build & Test, 2. Container Configuration, Deployment Architecture, Deployment Process, Production Infrastructure

### Community 142 - "Key flows"
Cohesion: 0.40
Nodes (5): 1. JWT login and refresh, 2. Offline expense sync and conflicts, 3. Settlements and balances (high level), 4. Request logging → SystemLog → admin UI, Key flows

### Community 143 - "LedgerCore documentation"
Cohesion: 0.40
Nodes (5): AI agents, Archived reports, LedgerCore documentation, Live API reference, Start here

### Community 144 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, eject, start, test

### Community 148 - "Add API endpoint"
Cohesion: 0.50
Nodes (3): Add API endpoint, Permissions checklist, Steps

### Community 149 - "Debug runtime"
Cohesion: 0.50
Nodes (3): Debug runtime, Fix, Steps

### Community 150 - "Django migrate"
Cohesion: 0.50
Nodes (3): Django migrate, Rules, Steps

### Community 151 - "domain-glossary.md"
Cohesion: 0.50
Nodes (3): Domain glossary, Naming traps, Split modes (expenses)

### Community 152 - "Offline sync"
Cohesion: 0.50
Nodes (3): Agent checklist before changing sync, Offline sync, Protocol

### Community 154 - "Filtering & Sorting"
Cohesion: 0.50
Nodes (4): Filtering, Filtering & Sorting, Search, Sorting

### Community 155 - "Migration Strategy"
Cohesion: 0.50
Nodes (4): Migration Best Practices, Migration Strategy, Sample Migration, Version Control

### Community 156 - "Final Tips"
Cohesion: 0.50
Nodes (4): 🎯 Best Practices, Final Tips, 🚀 Performance Tips, 🔒 Security Reminders

### Community 157 - "Development Workflow"
Cohesion: 0.50
Nodes (4): Commit Message Convention, 🔄 Daily Development Flow, Development Workflow, Git Workflow

### Community 158 - "lazyWithRetry.ts"
Cohesion: 0.83
Nodes (3): isChunkLoadError(), lazyWithRetry(), retryKeyFor()

### Community 171 - "API map"
Cohesion: 0.67
Nodes (3): Adding an endpoint, API map, Patterns

### Community 172 - "Authentication"
Cohesion: 0.67
Nodes (3): Authentication, JWT Authentication, Token Lifecycle

### Community 173 - "react"
Cohesion: 0.67
Nodes (3): react, SkipLink(), react

## Knowledge Gaps
- **764 isolated node(s):** `Migration`, `Migration`, `Meta`, `Migration`, `Migration` (+759 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TimeStampedModel` connect `TimeStampedModel` to `User`, `GroupInvitation`, `Notification`, `Currency`, `PaymentWebhook`, `ExpenseShare`, `WalletAllocation`, `Entity`, `PaymentRequest`, `GeneratedReport`, `Expense`, `Group`, `MonthlyBudget`, `models.py`, `Settlement`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `UUIDModel` connect `MonthlyBudget` to `GroupInvitation`, `Notification`, `PaymentWebhook`, `ExpenseShare`, `WalletAllocation`, `Entity`, `PaymentRequest`, `GeneratedReport`, `TimeStampedModel`, `Expense`, `Group`, `models.py`, `Settlement`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Group` connect `Group` to `GroupInvitation`, `views.py`, `TimeStampedModel`, `GroupMembershipSerializer`, `GroupSerializer`, `GroupInvitationSerializer`, `MonthlyBudget`, `GroupViewSet`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `User` (e.g. with `ChangePasswordSerializer` and `CustomTokenObtainPairSerializer`) actually correct?**
  _`User` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `Expense` (e.g. with `ExpenseFilterMixin` and `CategorySerializer`) actually correct?**
  _`Expense` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `UserProfile` (e.g. with `ChangePasswordSerializer` and `CustomTokenObtainPairSerializer`) actually correct?**
  _`UserProfile` has 27 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `EmailVerification` (e.g. with `ChangePasswordSerializer` and `CustomTokenObtainPairSerializer`) actually correct?**
  _`EmailVerification` has 27 INFERRED edges - model-reasoned connections that need verification._