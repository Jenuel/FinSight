from django.db import migrations, models


def rename_forward(apps, schema_editor):
    """
    Rename 0006 vocabulary → original 0005 vocabulary:
      unreconciled → pending
      reconciled   → cleared
      adjusted     → adjusted  (already correct; no-op)
      excluded     → pending   (excluded had no equivalent; treat as not-yet-cleared)
    """
    Transaction = apps.get_model('transactions', 'Transaction')
    db = schema_editor.connection.alias
    Transaction.objects.using(db).filter(reconciliation_status='unreconciled').update(
        reconciliation_status='pending'
    )
    Transaction.objects.using(db).filter(reconciliation_status='reconciled').update(
        reconciliation_status='cleared'
    )
    # excluded had no equivalent in the original vocabulary; treat as pending
    Transaction.objects.using(db).filter(reconciliation_status='excluded').update(
        reconciliation_status='pending'
    )


def rename_reverse(apps, schema_editor):
    """Reverse: restore 0006 vocabulary for rollback safety."""
    Transaction = apps.get_model('transactions', 'Transaction')
    db = schema_editor.connection.alias
    Transaction.objects.using(db).filter(reconciliation_status='pending').update(
        reconciliation_status='unreconciled'
    )
    Transaction.objects.using(db).filter(reconciliation_status='cleared').update(
        reconciliation_status='reconciled'
    )
    # adjusted stays as-is; no 0006 equivalent existed


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0006_alter_transaction_entry_type_and_more'),
    ]

    operations = [
        # 1. Update the field definition (choices + default + max_length)
        migrations.AlterField(
            model_name='transaction',
            name='reconciliation_status',
            field=models.CharField(
                choices=[
                    ('pending',  'Pending'),
                    ('cleared',  'Cleared'),
                    ('adjusted', 'Adjusted'),
                ],
                default='pending',
                max_length=10,
            ),
        ),
        # 2. Rename existing DB values to match the restored vocabulary
        migrations.RunPython(rename_forward, reverse_code=rename_reverse),
    ]
