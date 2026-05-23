import csv
import io
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.expenses.models import Expense
from .models import Entity, AuditEvent, ExportJob
from .serializers import EntitySerializer, AuditEventSerializer, ExportJobSerializer
from .permissions import IsEnterpriseAdmin


class EntityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEnterpriseAdmin]
    serializer_class = EntitySerializer
    queryset = Entity.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(tax_id__icontains=q)
        return qs.prefetch_related('squads')

    def perform_create(self, serializer):
        serializer.save(supervised_by=self.request.user)


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsEnterpriseAdmin]
    serializer_class = AuditEventSerializer
    queryset = AuditEvent.objects.select_related('actor', 'entity').all()

    def get_queryset(self):
        qs = super().get_queryset()
        entity_id = self.request.query_params.get('entity')
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        return qs


class ExportJobViewSet(viewsets.ModelViewSet):
    permission_classes = [IsEnterpriseAdmin]
    serializer_class = ExportJobSerializer
    queryset = ExportJob.objects.filter(created_by=self.request.user) if False else ExportJob.objects.all()

    def get_queryset(self):
        return ExportJob.objects.filter(created_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        job = serializer.save(created_by=self.request.user, status='processing')
        self._process_job(job)

    def _process_job(self, job):
        try:
            expenses = Expense.objects.filter(
                is_deleted=False,
                expense_date__gte=job.date_from,
                expense_date__lte=job.date_to,
            ).select_related('paid_by', 'category', 'currency')[:5000]

            buffer = io.StringIO()
            writer = csv.writer(buffer)
            cols = job.columns or ['id', 'title', 'amount', 'date', 'category']
            writer.writerow(cols)
            for e in expenses:
                row = []
                for c in cols:
                    if c == 'id':
                        row.append(str(e.id))
                    elif c == 'title':
                        row.append(e.title)
                    elif c in ('amount',):
                        row.append(str(e.amount))
                    elif c in ('date', 'expense_date'):
                        row.append(str(e.expense_date))
                    elif c == 'category':
                        row.append(e.category.name if e.category else '')
                    elif c == 'entity_name':
                        row.append(e.paid_by.get_full_name() if e.paid_by else '')
                    else:
                        row.append('')
                writer.writerow(row)

            job.file_path = f"exports/{job.id}.csv"
            job.status = 'completed'
            job.save(update_fields=['file_path', 'status'])
        except Exception as exc:
            job.status = 'failed'
            job.error_message = str(exc)
            job.save(update_fields=['status', 'error_message'])

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        job = self.get_object()
        if job.status != 'completed':
            return Response({'detail': 'Export not ready'}, status=status.HTTP_400_BAD_REQUEST)
        expenses = Expense.objects.filter(
            is_deleted=False,
            expense_date__gte=job.date_from,
            expense_date__lte=job.date_to,
        )[:5000]
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ledgercore_export_{job.id}.csv"'
        writer = csv.writer(response)
        writer.writerow(job.columns or ['id', 'title', 'amount'])
        for e in expenses:
            writer.writerow([str(e.id), e.title, str(e.amount)])
        return response
