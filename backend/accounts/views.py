from rest_framework import viewsets
from .models import Account
from .serializers import AccountSerializer

class AccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Accounts.
    """
    serializer_class = AccountSerializer

    def get_queryset(self):
        # IsAuthenticated is enforced globally (see REST_FRAMEWORK in settings),
        # so request.user is always a real user here. Scoping every read to the
        # owner is what makes object-level permissions implicit on detail routes.
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

