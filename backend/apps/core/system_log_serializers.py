from rest_framework import serializers
from .models import SystemLog


class SystemLogUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()


class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = SystemLog
        fields = [
            'id',
            'level',
            'category',
            'message',
            'user',
            'user_email',
            'user_name',
            'request_method',
            'request_path',
            'status_code',
            'duration_ms',
            'ip_address',
            'user_agent',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields

    def get_user_email(self, obj):
        return obj.user.email if obj.user_id else None

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user_id else None
