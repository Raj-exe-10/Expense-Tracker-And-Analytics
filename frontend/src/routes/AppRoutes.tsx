import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthGuard, PublicGuard, AdminGuard } from './guards';
import { PersonalShell } from '../layout/PersonalShell';
import { SearchShell } from '../layout/SearchShell';
import { AdminShell } from '../layout/AdminShell';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import MorePage from '../pages/app/MorePage';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const HomePage = lazyWithRetry(() => import('../pages/app/HomePage'));
const Expenses = lazyWithRetry(() => import('../pages/Expenses'));
const ExpenseDetail = lazyWithRetry(() => import('../pages/ExpenseDetail'));
const AddExpensePage = lazyWithRetry(() => import('../pages/app/AddExpensePage'));
const Budget = lazyWithRetry(() => import('../pages/Budget'));
const PeoplePage = lazyWithRetry(() => import('../pages/app/PeoplePage'));
const SquadDetailPage = lazyWithRetry(() => import('../pages/app/SquadDetailPage'));
const Analytics = lazyWithRetry(() => import('../pages/Analytics'));
const PostGameAnalyticsPage = lazyWithRetry(() => import('../pages/app/PostGameAnalyticsPage'));
const Settlements = lazyWithRetry(() => import('../pages/Settlements'));
const SettlementReportsPage = lazyWithRetry(() => import('../pages/app/SettlementReportsPage'));
const Settings = lazyWithRetry(() => import('../pages/Settings'));
const SecurityPage = lazyWithRetry(() => import('../pages/app/SecurityPage'));
const Profile = lazyWithRetry(() => import('../pages/Profile'));
const HelpSupport = lazyWithRetry(() => import('../pages/HelpSupport'));
const NotificationsPage = lazyWithRetry(() => import('../pages/Notifications'));
const JoinGroup = lazyWithRetry(() => import('../pages/JoinGroup'));
const RecurringPage = lazyWithRetry(() => import('../pages/app/RecurringPage'));
const SearchHubPage = lazyWithRetry(() => import('../pages/search/SearchHubPage'));
const SearchLedgerPage = lazyWithRetry(() => import('../pages/search/SearchLedgerPage'));
const SearchAuditPage = lazyWithRetry(() => import('../pages/search/SearchAuditPage'));
const SearchExportPage = lazyWithRetry(() => import('../pages/search/SearchExportPage'));
const SearchSquadsPage = lazyWithRetry(() => import('../pages/search/SearchSquadsPage'));
const AdminDashboard = lazyWithRetry(() => import('../pages/admin/AdminDashboard'));
const AdminEntitiesPage = lazyWithRetry(() => import('../pages/admin/AdminEntitiesPage'));
const AdminAuditPage = lazyWithRetry(() => import('../pages/admin/AdminAuditPage'));
const AdminExportPage = lazyWithRetry(() => import('../pages/admin/AdminExportPage'));
const AdminAlertsPage = lazyWithRetry(() => import('../pages/admin/AdminAlertsPage'));
const AdminLedgerPage = lazyWithRetry(() => import('../pages/admin/AdminLedgerPage'));
const AdminVaultPage = lazyWithRetry(() => import('../pages/admin/AdminVaultPage'));
const AdminReportsPage = lazyWithRetry(() => import('../pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazyWithRetry(() => import('../pages/admin/AdminSettingsPage'));
const AdminSystemLogsPage = lazyWithRetry(() => import('../pages/admin/AdminSystemLogsPage'));
const TermsPage = lazyWithRetry(() => import('../pages/legal/TermsPage'));
const PrivacyPage = lazyWithRetry(() => import('../pages/legal/PrivacyPage'));
const SyncConflictHost = lazyWithRetry(() => import('../components/sync/SyncConflictHost'));
const LandingPage = lazyWithRetry(() => import('../pages/landing/LandingPage'));

const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
    <CircularProgress />
  </Box>
);

const LegacyRedirect = ({ to }: { to: string }) => <Navigate to={to} replace />;

/** Redirect legacy /expenses/:id/* URLs into the /app shell. */
const LegacyExpenseRedirect = ({ suffix = '' }: { suffix?: string }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/app/expenses" replace />;
  return <Navigate to={`/app/expenses/${id}${suffix}`} replace />;
};

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <SyncConflictHost />
    <Routes>
      <Route
        path="/login"
        element={
          <PublicGuard>
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          </PublicGuard>
        }
      />
      <Route
        path="/register"
        element={
          <PublicGuard>
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          </PublicGuard>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicGuard>
            <AuthLayout>
              <ForgotPasswordForm />
            </AuthLayout>
          </PublicGuard>
        }
      />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      <Route
        path="/app"
        element={
          <AuthGuard>
            <PersonalShell />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/:id" element={<ExpenseDetail />} />
        <Route path="expenses/:id/edit" element={<ExpenseDetail />} />
        <Route path="add" element={<AddExpensePage />} />
        <Route path="budget" element={<Budget />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="squads/:id" element={<SquadDetailPage />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/post-game" element={<PostGameAnalyticsPage />} />
        <Route path="settlements" element={<Settlements />} />
        <Route path="settlements/reports" element={<SettlementReportsPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/security" element={<SecurityPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="help" element={<HelpSupport />} />
        <Route path="recurring" element={<RecurringPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="groups/join/:inviteCode" element={<JoinGroup />} />
      </Route>

      <Route
        path="/search"
        element={
          <AuthGuard>
            <SearchShell />
          </AuthGuard>
        }
      >
        <Route index element={<SearchHubPage />} />
        <Route path="ledger" element={<SearchLedgerPage />} />
        <Route path="squads" element={<SearchSquadsPage />} />
        <Route path="audit" element={<SearchAuditPage />} />
        <Route path="export" element={<SearchExportPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AuthGuard>
            <AdminGuard>
              <AdminShell />
            </AdminGuard>
          </AuthGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="ledger" element={<AdminLedgerPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="logs" element={<AdminSystemLogsPage />} />
        <Route path="entities" element={<AdminEntitiesPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="export" element={<AdminExportPage />} />
        <Route path="alerts" element={<AdminAlertsPage />} />
        <Route path="vault" element={<AdminVaultPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Legacy URL redirects */}
      <Route path="/dashboard" element={<LegacyRedirect to="/app/home" />} />
      <Route path="/expenses" element={<LegacyRedirect to="/app/expenses" />} />
      <Route path="/expenses/add" element={<LegacyRedirect to="/app/add" />} />
      <Route path="/expenses/:id/edit" element={<LegacyExpenseRedirect suffix="/edit" />} />
      <Route path="/expenses/:id" element={<LegacyExpenseRedirect />} />
      <Route path="/groups" element={<LegacyRedirect to="/app/people" />} />
      <Route path="/groups/join/:inviteCode" element={<LegacyRedirect to="/app/groups/join/:inviteCode" />} />
      <Route path="/analytics" element={<LegacyRedirect to="/app/analytics" />} />
      <Route path="/budget" element={<LegacyRedirect to="/app/budget" />} />
      <Route path="/settlements" element={<LegacyRedirect to="/app/settlements" />} />
      <Route path="/settings" element={<LegacyRedirect to="/app/settings" />} />
      <Route path="/profile" element={<LegacyRedirect to="/app/profile" />} />
      <Route path="/notifications" element={<LegacyRedirect to="/app/notifications" />} />
      <Route path="/help" element={<LegacyRedirect to="/app/help" />} />

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
