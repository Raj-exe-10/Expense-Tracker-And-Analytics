from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from rest_framework import serializers
from .models import PaymentRequest, Settlement


class PaymentRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    payee_name = serializers.CharField(source='payee.get_full_name', read_only=True)
    currency_code = serializers.CharField(source='currency.code', read_only=True)

    class Meta:
        model = PaymentRequest
        fields = [
            'id', 'requester', 'requester_name', 'payee', 'payee_name',
            'group', 'amount', 'currency', 'currency_code', 'note',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'requester', 'status', 'created_at', 'updated_at']


class PaymentRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentRequestSerializer

    def get_queryset(self):
        user = self.request.user
        return PaymentRequest.objects.filter(
            Q(requester=user) | Q(payee=user)
        ).select_related('requester', 'payee', 'currency', 'group')

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, status='pending')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pr = self.get_object()
        if pr.payee_id != request.user.id:
            return Response({'detail': 'Only payee can approve'}, status=status.HTTP_403_FORBIDDEN)
        if pr.status != 'pending':
            return Response({'detail': 'Not pending'}, status=status.HTTP_400_BAD_REQUEST)
        settlement = Settlement.objects.create(
            payer=pr.requester,
            payee=pr.payee,
            amount=pr.amount,
            currency=pr.currency,
            group=pr.group,
            status='completed',
            settlement_method='manual',
            description=pr.note or 'Payment request approved',
            completed_at=timezone.now(),
            is_confirmed_by_payer=True,
            is_confirmed_by_payee=True,
        )
        pr.status = 'approved'
        pr.settlement = settlement
        pr.save(update_fields=['status', 'settlement'])
        return Response(self.get_serializer(pr).data)

    @action(detail=True, methods=['post'])
    def dispute(self, request, pk=None):
        pr = self.get_object()
        if pr.payee_id != request.user.id:
            return Response({'detail': 'Only payee can dispute'}, status=status.HTTP_403_FORBIDDEN)
        pr.status = 'disputed'
        pr.save(update_fields=['status'])
        return Response(self.get_serializer(pr).data)

    @action(detail=False, methods=['get'])
    def pending_for_me(self, request):
        try:
            qs = self.get_queryset().filter(payee=request.user, status='pending')
            return Response(self.get_serializer(qs, many=True).data)
        except Exception:
            # Table may be missing before migrations; avoid 500 on home screen
            return Response([])
