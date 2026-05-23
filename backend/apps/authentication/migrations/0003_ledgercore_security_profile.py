# Generated for LedgerCore platform revamp

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('user', 'Regular User'),
                    ('premium', 'Premium User'),
                    ('admin', 'Administrator'),
                    ('enterprise_admin', 'Enterprise Administrator'),
                ],
                default='user',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='hide_balances',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='contacts_sync_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='biometric_lock_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='totp_secret',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='totp_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='app_lock_pin_hash',
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
