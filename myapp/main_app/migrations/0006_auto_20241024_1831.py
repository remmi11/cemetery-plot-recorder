# Generated by Django 2.1.8 on 2024-10-24 12:31

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main_app', '0005_auto_20241021_2352'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='mastergeom',
            name='created_at',
        ),
        migrations.RemoveField(
            model_name='mastergeom',
            name='updated_at',
        ),
    ]
