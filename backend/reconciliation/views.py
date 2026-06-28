from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ReconciliationSession
from .serializers import ReconciliationSessionSerializer, ReconciliationCloseSerializer

class ReconciliationSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Reconciliation Sessions.
    """
    serializer_class = ReconciliationSessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            queryset = ReconciliationSession.objects.filter(account__user=user)
        else:
            queryset = ReconciliationSession.objects.filter(account__user__isnull=True)

        # Query parameter filtering
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(account_id=account_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    @action(detail=True, methods=['POST'])
    def close(self, request, pk=None):
        session = self.get_object()
        if session.status == 'closed':
            return Response(
                {"detail": "This reconciliation session is already closed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReconciliationCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        actual_balance = serializer.validated_data['actual_balance']

        session.close(actual_balance)

        # Reload session to get computed values
        session.refresh_from_db()
        return Response(self.get_serializer(session).data)
