from rest_framework import viewsets
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing Transactions.
    """
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            queryset = Transaction.objects.filter(account__user=user)
        else:
            queryset = Transaction.objects.filter(account__user__isnull=True)

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

        return queryset
