from django.db import migrations, models
import django.db.models.deletion


def delete_ownerless_accounts(apps, schema_editor):
    """
    Remove accounts with no owner before the NOT NULL constraint is applied.

    These rows predate the global IsAuthenticated policy. They are already
    unreachable through the API - every viewset scopes its queryset to
    user=request.user - so no live client can read or write them. Their
    transactions and reconciliation sessions cascade away with them.
    """
    Account = apps.get_model('accounts', 'Account')
    Account.objects.filter(user__isnull=True).delete()


def noop_reverse(apps, schema_editor):
    """Deleted rows cannot be restored; reversing only drops the constraint."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_account_color_account_icon'),
    ]

    operations = [
        migrations.RunPython(delete_ownerless_accounts, noop_reverse),
        migrations.AlterField(
            model_name='account',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='accounts',
                to='auth.user',
            ),
        ),
    ]
