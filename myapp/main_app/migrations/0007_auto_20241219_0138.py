# Generated by Django 2.1.8 on 2024-12-18 19:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main_app', '0006_auto_20241024_1831'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='addition',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='block',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='county',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='geom',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='lot',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='ogc_fid',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='plot',
        ),
        migrations.RemoveField(
            model_name='cemeteryplot',
            name='unit',
        ),
        migrations.AddField(
            model_name='cemeteryplot',
            name='master_geom',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='main_app.MasterGeom'),
        ),
    ]
