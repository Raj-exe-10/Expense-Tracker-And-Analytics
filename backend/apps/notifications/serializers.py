from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationPreference

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested representations"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'priority',
            'is_read', 'read_at', 'related_object_type', 'related_object_id',
            'action_url', 'metadata', 'sender', 'created_at'
        ]
        read_only_fields = [
            'id', 'is_read', 'read_at', 'created_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'notification_type', 'is_enabled', 'delivery_methods',
            'quiet_hours_start', 'quiet_hours_end', 'frequency_limit'
        ]
        read_only_fields = ['id']
