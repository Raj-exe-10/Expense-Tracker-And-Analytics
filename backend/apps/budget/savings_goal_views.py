from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import SavingsGoal
from .savings_goal_serializers import SavingsGoalSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).select_related('currency')
