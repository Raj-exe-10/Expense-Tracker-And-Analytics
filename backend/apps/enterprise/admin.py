from django.contrib import admin
from .models import Entity, AuditEvent, ExportJob

admin.site.register(Entity)
admin.site.register(AuditEvent)
admin.site.register(ExportJob)
