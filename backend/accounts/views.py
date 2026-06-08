from rest_framework import viewsets
from .models import CashAccount
from .serializers import CashAccountSerializer

class CashAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Cash Accounts.
    """
    serializer_class = CashAccountSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return CashAccount.objects.filter(user=user)
        return CashAccount.objects.filter(user__isnull=True)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

