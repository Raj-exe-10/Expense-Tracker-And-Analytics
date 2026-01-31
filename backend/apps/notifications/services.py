"""
Notification services for creating and managing notifications
"""
from django.utils import timezone
from .models import Notification


class NotificationService:
    """Service class for creating notifications"""
    
    @staticmethod
    def create_notification(
        user,
        notification_type,
        title,
        message,
        sender=None,
        priority='normal',
        related_object_type='',
        related_object_id='',
        action_url='',
        metadata=None
    ):
        """Create a notification for a user"""
        return Notification.objects.create(
            user=user,
            sender=sender,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            related_object_type=related_object_type,
            related_object_id=str(related_object_id) if related_object_id else '',
            action_url=action_url,
            metadata=metadata or {}
        )
    
    @classmethod
    def notify_expense_added(cls, expense, creator):
        """
        Notify relevant users when an expense is added.
        - For group expenses: notify all group members except the creator
        - For personal expenses with shares: notify users in shares
        """
        notifications = []
        
        if expense.group:
            # Notify all group members except the creator
            from apps.groups.models import GroupMembership
            memberships = GroupMembership.objects.filter(
                group=expense.group,
                is_active=True
            ).exclude(user=creator).select_related('user')
            
            for membership in memberships:
                notification = cls.create_notification(
                    user=membership.user,
                    notification_type='expense_added',
                    title='New Group Expense',
                    message=f'{creator.get_full_name() or creator.username} added "{expense.title or expense.description}" for ${expense.amount:.2f} in {expense.group.name}',
                    sender=creator,
                    related_object_type='expense',
                    related_object_id=expense.id,
                    action_url=f'/expenses/{expense.id}',
                    metadata={
                        'expense_id': str(expense.id),
                        'group_id': str(expense.group.id),
                        'amount': float(expense.amount),
                        'currency': expense.currency.code if expense.currency else 'USD',
                    }
                )
                notifications.append(notification)
        else:
            # Notify users in expense shares (if any) except the creator
            from apps.expenses.models import ExpenseShare
            shares = ExpenseShare.objects.filter(
                expense=expense
            ).exclude(user=creator).select_related('user')
            
            for share in shares:
                notification = cls.create_notification(
                    user=share.user,
                    notification_type='expense_added',
                    title='New Shared Expense',
                    message=f'{creator.get_full_name() or creator.username} added "{expense.title or expense.description}" for ${expense.amount:.2f}. Your share: ${share.amount:.2f}',
                    sender=creator,
                    related_object_type='expense',
                    related_object_id=expense.id,
                    action_url=f'/expenses/{expense.id}',
                    metadata={
                        'expense_id': str(expense.id),
                        'amount': float(expense.amount),
                        'share_amount': float(share.amount),
                        'currency': expense.currency.code if expense.currency else 'USD',
                    }
                )
                notifications.append(notification)
        
        return notifications
    
    @classmethod
    def notify_expense_updated(cls, expense, updater):
        """Notify relevant users when an expense is updated"""
        notifications = []
        
        if expense.group:
            from apps.groups.models import GroupMembership
            memberships = GroupMembership.objects.filter(
                group=expense.group,
                is_active=True
            ).exclude(user=updater).select_related('user')
            
            for membership in memberships:
                notification = cls.create_notification(
                    user=membership.user,
                    notification_type='expense_updated',
                    title='Expense Updated',
                    message=f'{updater.get_full_name() or updater.username} updated "{expense.title or expense.description}" (${expense.amount:.2f}) in {expense.group.name}',
                    sender=updater,
                    related_object_type='expense',
                    related_object_id=expense.id,
                    action_url=f'/expenses/{expense.id}',
                )
                notifications.append(notification)
        
        return notifications
    
    @classmethod
    def notify_group_joined(cls, group, new_member, added_by=None):
        """Notify group members when someone joins"""
        from apps.groups.models import GroupMembership
        
        notifications = []
        memberships = GroupMembership.objects.filter(
            group=group,
            is_active=True
        ).exclude(user=new_member).select_related('user')
        
        for membership in memberships:
            notification = cls.create_notification(
                user=membership.user,
                notification_type='group_joined',
                title='New Group Member',
                message=f'{new_member.get_full_name() or new_member.username} joined {group.name}',
                sender=added_by or new_member,
                related_object_type='group',
                related_object_id=group.id,
                action_url=f'/groups/{group.id}',
            )
            notifications.append(notification)
        
        # Notify the new member as well
        if added_by and added_by != new_member:
            cls.create_notification(
                user=new_member,
                notification_type='group_invitation',
                title='Added to Group',
                message=f'{added_by.get_full_name() or added_by.username} added you to {group.name}',
                sender=added_by,
                related_object_type='group',
                related_object_id=group.id,
                action_url=f'/groups/{group.id}',
            )
        
        return notifications
    
    @classmethod
    def notify_payment_received(cls, settlement, payer, payee):
        """Notify when a payment/settlement is made"""
        cls.create_notification(
            user=payee,
            notification_type='payment_received',
            title='Payment Received',
            message=f'{payer.get_full_name() or payer.username} paid you ${settlement.amount:.2f}',
            sender=payer,
            priority='high',
            related_object_type='settlement',
            related_object_id=settlement.id,
            action_url='/settlements',
            metadata={
                'settlement_id': str(settlement.id),
                'amount': float(settlement.amount),
            }
        )
        
        return cls.create_notification(
            user=payer,
            notification_type='settlement_completed',
            title='Settlement Completed',
            message=f'Your payment of ${settlement.amount:.2f} to {payee.get_full_name() or payee.username} was completed',
            priority='normal',
            related_object_type='settlement',
            related_object_id=settlement.id,
            action_url='/settlements',
        )
    
    @classmethod
    def notify_payment_due(cls, user, amount, group=None, reminder_type='weekly'):
        """Notify user about pending payments"""
        if group:
            message = f'You have ${amount:.2f} in pending settlements in {group.name}'
        else:
            message = f'You have ${amount:.2f} in total pending settlements'
        
        return cls.create_notification(
            user=user,
            notification_type='payment_due',
            title='Payment Reminder',
            message=message,
            priority='normal',
            action_url='/settlements',
            metadata={
                'amount': float(amount),
                'group_id': str(group.id) if group else None,
                'reminder_type': reminder_type,
            }
        )
