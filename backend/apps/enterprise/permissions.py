from rest_framework.permissions import BasePermission

ADMIN_ROLES = ('admin', 'enterprise_admin')


class IsEnterpriseAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ADMIN_ROLES
        )
