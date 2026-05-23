from rest_framework import serializers
from .models import Entity, AuditEvent, ExportJob


class EntitySerializer(serializers.ModelSerializer):
    active_squads_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Entity
        fields = [
            'id', 'name', 'tax_id', 'balance', 'status',
            'active_squads_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'active_squads_count']


class AuditEventSerializer(serializers.ModelSerializer):
    actor_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = [
            'id', 'action_type', 'description', 'actor', 'actor_display',
            'is_system', 'entity', 'status', 'metadata', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_actor_display(self, obj):
        if obj.is_system:
            return 'System'
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return obj.actor_name or 'Unknown'


class ExportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportJob
        fields = [
            'id', 'format', 'date_from', 'date_to', 'columns',
            'status', 'file_path', 'error_message', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'file_path', 'error_message', 'created_at']
