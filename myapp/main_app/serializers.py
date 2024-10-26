from rest_framework import serializers
from .models import *

class CustomUserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		fields = ('id', 'remember_token', 'role_id', 'edit_auth', 'date_joined', 'last_login', 'username', 'email', 'is_superuser')

class CemeteryPlotSerializer(serializers.ModelSerializer):
	class Meta:
		model = CemeteryPlot
		fields = ('id', 'ogc_fid', 'first_name', 'middle_name', 'last_name', 'suffix', 'maiden_name',
					'is_veteran', 'county', 'addition', 'unit', 'block', 'lot', 'plot', 'geom')

	def to_representation(self, instance):
		representation = super(CemeteryPlotSerializer, self).to_representation(instance)
		# representation['meridian'] = ""
		# if instance.plss_meridian:
		# 	representation['meridian'] = Meridian.objects.get(code=instance.plss_meridian).title
		return representation
