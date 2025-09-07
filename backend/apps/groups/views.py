from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
import random
import string

from .models import Group, GroupMembership, GroupInvitation, GroupActivity
from .serializers import (
    GroupSerializer, GroupMembershipSerializer,
    GroupInvitationSerializer, GroupActivitySerializer
)
from apps.expenses.models import Expense, ExpenseShare
from apps.authentication.models import User


class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing groups.
    """
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Group.objects.filter(
            members=self.request.user
        ).distinct()
    
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        
        # Add creator as admin member
        GroupMembership.objects.create(
            group=group,
            user=self.request.user,
            role='admin',
            joined_at=timezone.now()
        )
        
        # Log activity
        GroupActivity.objects.create(
            group=group,
            user=self.request.user,
            activity_type='group_created',
            description=f'Created group "{group.name}"'
        )
    
    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        """Invite a member to the group"""
        group = self.get_object()
        
        # Check if user is admin
        membership = GroupMembership.objects.filter(
            group=group,
            user=request.user,
            role='admin'
        ).first()
        
        if not membership:
            return Response(
                {'error': 'Only admins can invite members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        phone = request.data.get('phone_number')
        message = request.data.get('message', '')
        
        if not email and not phone:
            return Response(
                {'error': 'Email or phone number required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate invite code
        invite_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Create invitation
        invitation = GroupInvitation.objects.create(
            group=group,
            invited_by=request.user,
            email=email,
            phone_number=phone,
            invite_code=invite_code,
            message=message,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # TODO: Send invitation email/SMS
        
        # Log activity
        GroupActivity.objects.create(
            group=group,
            user=request.user,
            activity_type='member_invited',
            description=f'Invited {email or phone} to the group'
        )
        
        return Response({
            'message': 'Invitation sent',
            'invitation': GroupInvitationSerializer(invitation).data
        })
    
    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a group using invite code"""
        invite_code = request.data.get('invite_code')
        
        if not invite_code:
            return Response(
                {'error': 'Invite code required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find invitation
        invitation = GroupInvitation.objects.filter(
            invite_code=invite_code,
            status='pending',
            expires_at__gt=timezone.now()
        ).first()
        
        if not invitation:
            return Response(
                {'error': 'Invalid or expired invite code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already member
        if GroupMembership.objects.filter(
            group=invitation.group,
            user=request.user
        ).exists():
            return Response(
                {'error': 'You are already a member of this group'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        membership = GroupMembership.objects.create(
            group=invitation.group,
            user=request.user,
            role='member',
            joined_at=timezone.now()
        )
        
        # Update invitation
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        # Log activity
        GroupActivity.objects.create(
            group=invitation.group,
            user=request.user,
            activity_type='member_joined',
            description=f'{request.user.get_full_name()} joined the group'
        )
        
        return Response({
            'message': 'Successfully joined group',
            'group': GroupSerializer(invitation.group).data
        })
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a group"""
        group = self.get_object()
        
        membership = GroupMembership.objects.filter(
            group=group,
            user=request.user
        ).first()
        
        if not membership:
            return Response(
                {'error': 'You are not a member of this group'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if last admin
        if membership.role == 'admin':
            admin_count = GroupMembership.objects.filter(
                group=group,
                role='admin'
            ).count()
            
            if admin_count == 1:
                return Response(
                    {'error': 'Cannot leave group as the last admin. Please assign another admin first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Log activity
        GroupActivity.objects.create(
            group=group,
            user=request.user,
            activity_type='member_left',
            description=f'{request.user.get_full_name()} left the group'
        )
        
        # Delete membership
        membership.delete()
        
        return Response({'message': 'Successfully left group'})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get group members"""
        group = self.get_object()
        memberships = GroupMembership.objects.filter(group=group)
        serializer = GroupMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_member_role(self, request, pk=None):
        """Change a member's role"""
        group = self.get_object()
        
        # Check if user is admin
        if not GroupMembership.objects.filter(
            group=group,
            user=request.user,
            role='admin'
        ).exists():
            return Response(
                {'error': 'Only admins can change member roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if new_role not in ['admin', 'member']:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership = GroupMembership.objects.filter(
            group=group,
            user_id=user_id
        ).first()
        
        if not membership:
            return Response(
                {'error': 'User is not a member of this group'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.role = new_role
        membership.save()
        
        # Log activity
        GroupActivity.objects.create(
            group=group,
            user=request.user,
            activity_type='role_changed',
            description=f'Changed {membership.user.get_full_name()}\'s role to {new_role}'
        )
        
        return Response({
            'message': 'Role updated successfully',
            'membership': GroupMembershipSerializer(membership).data
        })
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get group statistics"""
        group = self.get_object()
        
        # Get date range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get expenses
        expenses = Expense.objects.filter(
            group=group,
            date__gte=start_date
        )
        
        # Calculate statistics
        stats = {
            'total_expenses': expenses.aggregate(Sum('amount'))['amount__sum'] or 0,
            'expense_count': expenses.count(),
            'average_expense': expenses.aggregate(Avg('amount'))['amount__avg'] or 0,
            'member_count': group.members.count(),
            'member_expenses': [],
            'category_breakdown': [],
            'monthly_trend': []
        }
        
        # Member expenses
        member_stats = expenses.values(
            'created_by__username',
            'created_by__first_name',
            'created_by__last_name'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        for member_stat in member_stats:
            stats['member_expenses'].append({
                'username': member_stat['created_by__username'],
                'name': f"{member_stat['created_by__first_name']} {member_stat['created_by__last_name']}",
                'total': float(member_stat['total']),
                'count': member_stat['count']
            })
        
        # Category breakdown
        category_stats = expenses.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5]
        stats['category_breakdown'] = list(category_stats)
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def balances(self, request, pk=None):
        """Get group member balances"""
        group = self.get_object()
        members = group.members.all()
        balances = {}
        
        # Initialize balances
        for member in members:
            balances[member.id] = {
                'user_id': member.id,
                'username': member.username,
                'name': member.get_full_name(),
                'balance': 0,
                'paid': 0,
                'share': 0
            }
        
        # Calculate balances from expenses
        expenses = Expense.objects.filter(
            group=group,
            is_settled=False
        )
        
        for expense in expenses:
            # Add to paid amount for creator
            if expense.created_by.id in balances:
                balances[expense.created_by.id]['paid'] += float(expense.amount)
            
            # Add shares
            shares = expense.shares.all()
            for share in shares:
                if share.user.id in balances:
                    balances[share.user.id]['share'] += float(share.amount)
        
        # Calculate net balances
        for member_id in balances:
            balances[member_id]['balance'] = (
                balances[member_id]['paid'] - balances[member_id]['share']
            )
        
        return Response(list(balances.values()))
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get group activities"""
        group = self.get_object()
        activities = GroupActivity.objects.filter(
            group=group
        ).order_by('-created_at')[:50]
        
        serializer = GroupActivitySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def settle_all(self, request, pk=None):
        """Mark all group expenses as settled"""
        group = self.get_object()
        
        # Check if user is admin
        if not GroupMembership.objects.filter(
            group=group,
            user=request.user,
            role='admin'
        ).exists():
            return Response(
                {'error': 'Only admins can settle all expenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Settle all expenses
        count = Expense.objects.filter(
            group=group,
            is_settled=False
        ).update(
            is_settled=True,
            settled_at=timezone.now()
        )
        
        # Log activity
        GroupActivity.objects.create(
            group=group,
            user=request.user,
            activity_type='expenses_settled',
            description=f'Settled all group expenses ({count} expenses)'
        )
        
        return Response({
            'message': f'Settled {count} expenses',
            'count': count
        })
