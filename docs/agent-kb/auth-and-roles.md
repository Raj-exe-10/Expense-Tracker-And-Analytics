# Auth and roles

## Backend

- Custom user: `authentication.User` (`USERNAME_FIELD = email`).
- Roles: `user`, `premium`, `admin`, `enterprise_admin`.
- JWT via SimpleJWT: access ~60m, refresh ~7d, rotation + blacklist.
  - `rest_framework_simplejwt.token_blacklist` **must** be in `INSTALLED_APPS` (migrate after install).
  - Logout blacklists the refresh token.
- Key routes under `/api/auth/` (login, register, token, refresh, logout, me, password reset, email verify).
- `UserViewSet` is **read-only**; privilege fields (`role`, `is_verified`, `is_premium`) are read-only on serializers. Self-updates use `UserUpdateSerializer` / `/me/` (no role).
- Extra security: `/api/auth/security/*` (TOTP, app-lock PIN) — `security_views.py`.
  - App-lock PIN verify requires authentication; lockout is separate from login lockout fields.
  - No TOTP “123456” bypass when `pyotp` is missing.

## Frontend session

1. Tokens in localStorage via `frontend/src/utils/storage.ts` (XSS-sensitive; do not also store in IndexedDB).
2. App mount: `checkAuthStatus` once — `frontend/src/auth/authBootstrap.ts` + `authSlice`.
3. Axios interceptor attaches Bearer token (`services/api.ts`).
4. On 401: deduplicated refresh in `authSession.ts`; retry **only** safe methods (GET/HEAD/OPTIONS); failure → `notifySessionExpired()`.
5. `AuthGuard`: require `user` after load; do not leave infinite spinner when profile fetch fails.
6. Do **not** full-page reload on refresh; use the shared refresh helper.

## Admin access

- SPA: `canAccessAdminZone()` in `frontend/src/utils/roles.ts` — `admin` or `enterprise_admin`.
- Guard: `AdminGuard` on `/admin/*`.
- Django admin site at `/admin/` is separate from the SPA admin zone.
