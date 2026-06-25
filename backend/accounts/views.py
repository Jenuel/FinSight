from rest_framework import viewsets
from .models import Account
from .serializers import AccountSerializer

class AccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Accounts.
    """
    serializer_class = AccountSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Account.objects.filter(user=user)
        return Account.objects.filter(user__isnull=True)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()

