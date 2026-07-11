# Auth and roles

## Backend

- Custom user: `authentication.User` (`USERNAME_FIELD = email`).
- Roles: `user`, `premium`, `admin`, `enterprise_admin`.
- JWT via SimpleJWT: access ~60m, refresh ~7d, rotation + blacklist (`backend/config/settings.py`).
- Key routes under `/api/auth/` (login, register, token, refresh, logout, me, password reset, email verify).
- Extra security: `/api/auth/security/*` (TOTP, app-lock PIN) — `security_views.py`.

## Frontend session

1. Tokens in localStorage via `frontend/src/utils/storage.ts`.
2. App mount: `checkAuthStatus` once — `frontend/src/auth/authBootstrap.ts` + `authSlice`.
3. Axios interceptor attaches Bearer token (`services/api.ts`).
4. On 401: deduplicated refresh in `frontend/src/services/authSession.ts`; failure → `notifySessionExpired()`.
5. Do **not** full-page reload on refresh; use the shared refresh helper.

## Admin access

- SPA: `canAccessAdminZone()` in `frontend/src/utils/roles.ts` — `admin` or `enterprise_admin`.
- Guard: `AdminGuard` on `/admin/*`.
- Django admin site at `/admin/` is separate from the SPA admin zone.
