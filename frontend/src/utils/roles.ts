import { User } from '../store/slices/authSlice';

const ADMIN_ROLES = ['admin', 'enterprise_admin'];

export function isEnterpriseAdmin(user: User | null): boolean {
  if (!user) return false;
  return ADMIN_ROLES.includes(user.role);
}

export function canAccessAdminZone(user: User | null): boolean {
  return isEnterpriseAdmin(user);
}
