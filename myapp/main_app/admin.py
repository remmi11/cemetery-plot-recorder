from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.contrib import auth
from django.contrib.auth.models import Group
from .models import *

# Register your models here.
class CustomUserAdmin(UserAdmin):
	list_display = ('username', 'first_name', 'last_name', 'email', 'edit_auth')
	fieldsets = (
		(None, {
			'fields': ('first_name', 'last_name', 'username', 'password', 'email')
		}),
		('Advanced options', {
			'classes': ('collapse'),
			'fields': ('edit_auth', 'is_superuser', 'is_staff', 'is_active')	
		})
	)
	add_fieldsets = (
		(None, {
			'fields': ('first_name', 'last_name', 'username', 'password1', 'password2', 'email')
		}),
		('Advanced options', {
			'classes': ('collapse'),
			'fields': ('edit_auth', 'is_superuser', 'is_staff', 'is_active')	
		})
	)

class MasterGeomAdmin(admin.ModelAdmin):
	list_display = ('id', 'ogc_fid', 'shape_leng', 'shape_area', 'county', 'addition', 
                    'unit', 'block', 'lot', 'plot', 'geom')	


admin.site.register(get_user_model(), CustomUserAdmin)
admin.site.register(MasterGeom, MasterGeomAdmin)
