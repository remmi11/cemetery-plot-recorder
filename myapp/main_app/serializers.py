from rest_framework import serializers
from .models import *


class CustomUserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		fields = ('id', 'remember_token', 'role_id', 'edit_auth', 'date_joined', 'last_login', 'username', 'email', 'is_superuser')

class CemeteryPlotFormSerializer(serializers.ModelSerializer):
	class Meta:
		model = CemeteryPlotForm
		fields = ('id', 'first_name', 'middle_name', 'last_name', 'suffix', 'maiden_name', 'is_veteran', 'created_at', 'updated_at')

class MasterGeomSerializer(serializers.ModelSerializer):
	cemetery_plot_form = CemeteryPlotFormSerializer()

	class Meta:
		model = MasterGeom
		fields = ('id', 'ogc_fid', 'shape_leng', 'shape_area', 'county', 'addition', 'unit', 'block', 'lot', 'cemetery_plot_form', 'geom')

