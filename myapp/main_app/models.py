from django.contrib.gis.db import models
from django.contrib.auth.models import AbstractUser
from datetime import datetime


class CustomUser(AbstractUser):
    remember_token = models.CharField(max_length=100, blank=True, null=True)
    role_id = models.IntegerField(blank=True, null=True)
    edit_auth = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super(CustomUser, self).save(*args, **kwargs)


class CemeteryPlot(models.Model):
    first_name = models.CharField(max_length=254, blank=True, null=True)
    middle_name = models.CharField(max_length=254, blank=True, null=True)
    last_name = models.CharField(max_length=254, blank=True, null=True)
    suffix = models.CharField(max_length=50, blank=True, null=True)
    maiden_name = models.CharField(max_length=254, blank=True, null=True)
    is_veteran = models.BooleanField(default=False)
    author = models.ForeignKey(CustomUser, related_name='plots', null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cemetery_plot'


class MasterGeom(models.Model):
    ogc_fid = models.IntegerField()
    shape_leng = models.DecimalField(max_digits=18, decimal_places=11, blank=True, null=True)
    shape_area = models.DecimalField(max_digits=18, decimal_places=11, blank=True, null=True)
    county = models.CharField(max_length=50, blank=True, null=True)
    addition = models.CharField(max_length=50, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    block = models.CharField(max_length=50, blank=True, null=True)
    lot = models.CharField(max_length=50, blank=True, null=True)
    plot = models.CharField(max_length=50, blank=True, null=True)
    geom = models.GeometryField(null=True, blank=True)
    cemetery_plot = models.OneToOneField(CemeteryPlot, null=True, blank=True, 
                                        on_delete=models.SET_NULL, related_name='geom')

    class Meta:
        db_table = 'master_geom'


