from rest_framework import viewsets
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Transactions.
    """
    serializer_class = TransactionSerializer

    def get_queryset(self):
        # select_related('account') because TransactionSerializer embeds
        # account_details; without it, listing N transactions costs N+1 queries.
        queryset = Transaction.objects.select_related('account').filter(
            account__user=self.request.user
        )

        # Query parameter filtering
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(account_id=account_id)

        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__iexact=category)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)

        entry_type = self.request.query_params.get('entry_type')
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)

        reconciliation_status = self.request.query_params.get('reconciliation_status')
        if reconciliation_status:
            queryset = queryset.filter(reconciliation_status=reconciliation_status)

        reconciliation_session = self.request.query_params.get('reconciliation_session')
        if reconciliation_session:
            queryset = queryset.filter(reconciliation_session_id=reconciliation_session)

        is_adjustment = self.request.query_params.get('is_adjustment')
        if is_adjustment is not None:
            queryset = queryset.filter(is_adjustment=is_adjustment.lower() in ('true', '1', 't'))

        is_backdated = self.request.query_params.get('is_backdated')
        if is_backdated is not None:
            queryset = queryset.filter(is_backdated=is_backdated.lower() in ('true', '1', 't'))

        return queryset
