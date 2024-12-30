from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Sum, Count, Prefetch
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import Http404
from django.core import exceptions
from django.core.serializers import serialize
from django.db import connection
from django.http import HttpResponse

import time
import json
import os
import math
import shutil
import csv
import uuid
from wsgiref.util import FileWrapper

from django.contrib.gis.geos import LineString, Point, Polygon, GEOSGeometry
from django.contrib.auth.decorators import login_required

from .models import *
from .serializers import *

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission

from datetime import datetime, timedelta

from django.contrib.auth.hashers import (
	check_password, is_password_usable, make_password,
)
import django.contrib.auth.password_validation as validators
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from reportlab.pdfgen import canvas
from reportlab.lib import colors
from textwrap import wrap
from collections import namedtuple

import hashlib
import hmac
import base64
import urllib.parse as urlparse
from dateutil.relativedelta import relativedelta

from .utils import *


DIR_PATH = "/home/ubuntu/Furman-2/myapp"
GEOM_LIMIT = 1000
GOOGLE_KEY = "AIzaSyDRedhDufTXIkZdO9kfmga9ch_EkOWbElM"
SECRET_KEY = 'HkT3EqphnEi8aoH6bOkyhucS2kk='

# api to get the information of the login user
class AuthView(APIView):
	permission_classes = (IsAuthenticated, )

	def get(self, request, format=None):
		user = CustomUser.objects.get(pk=request.user.id)
		user.last_login = datetime.now()
		user.save()
		return Response({
			'id': request.user.id,
			'username':	request.user.username,
			'email':	request.user.email,
			'first_name':	request.user.first_name,
			'last_name':	request.user.last_name,
			'edit_auth': request.user.edit_auth,
			'is_superuser': request.user.is_superuser
		})

# api to create new user
class CustomUserCreate(generics.ListCreateAPIView):
	queryset = CustomUser.objects.all()
	serializer_class = CustomUserSerializer
	permission_classes = []

	def get_queryset(self):
		return CustomUser.objects.all().order_by("id")

	def perform_create(self, serializer):
		# validation for username duplication
		queryset = CustomUser.objects.filter(username=self.request.data['username'])
		if queryset.exists():
			raise serializers.ValidationError('Username already exists!')

		# validation for email duplication
		queryset1 = CustomUser.objects.filter(email=self.request.data['email'])
		if queryset1.exists():
			raise serializers.ValidationError('Email already exists!')

		# password validation
		if 'password' in self.request.data and self.request.data['password'] != "":
			# try:
			# 	validators.validate_password(password=self.request.data['password'])
			# except exceptions.ValidationError as e:
			# 	raise serializers.ValidationError(list(e.messages), serializer)
			serializer.save(password=make_password(self.request.data['password']))


# # api to get geojson data
class AssetGeoJson(APIView):
	permission_classes = [IsAuthenticated, ]

	def get(self, request, format=None):
		condition_a = Q()
		
		mapped = request.GET.get('mapped', 'true')

		is_mapped = False
		if mapped == 'true':
			is_mapped = True

		page = int(request.GET.get('page', 1))
		st_index = (page - 1) * 50
		ed_index = page * 50

		if request.GET.get('bound') and request.GET.get('gf') == None:
			poly = Polygon.from_bbox(tuple(request.GET.get('bound').split(',')))
			if is_mapped:
				condition_a = Q(geom__contained=poly) 
			else:
				condition_a = ~Q(geom__contained=poly)

		if request.GET.get('global') and request.GET.get('global') != "":
			global_key = request.GET.get('global')
			temp = (Q(county__icontains = global_key) |
				Q(addition__icontains = global_key) |
				Q(unit__icontains = global_key) |
				Q(block__icontains = global_key) |
				Q(lot__icontains = global_key) |
				Q(plot__icontains = global_key) |
				Q(cemetery_plot_form__first_name__icontains = global_key) |
				Q(cemetery_plot_form__middle_name__icontains = global_key) |
				Q(cemetery_plot_form__last_name__icontains = global_key) |
				Q(cemetery_plot_form__suffix__icontains = global_key) |
				Q(cemetery_plot_form__maiden_name__icontains = global_key))

			condition_a = condition_a & temp

		if request.GET.get('first_name'):
			condition_a = condition_a & (Q(cemetery_plot_form__first_name__icontains=request.GET.get('first_name'))) 
		if request.GET.get('middle_name'):
			condition_a = condition_a & (Q(cemetery_plot_form__middle_name__icontains=request.GET.get('middle_name'))) 
		if request.GET.get('last_name'):
			condition_a = condition_a & (Q(cemetery_plot_form__last_name__icontains=request.GET.get('last_name'))) 
		if request.GET.get('suffix'):
			condition_a = condition_a & (Q(cemetery_plot_form__suffix__icontains=request.GET.get('suffix'))) 
		if request.GET.get('maiden_name'):
			condition_a = condition_a & (Q(cemetery_plot_form__maiden_name__icontains=request.GET.get('maiden_name'))) 

		if request.GET.get('county'):
			condition_a = condition_a & (Q(county__icontains=request.GET.get('county'))) 
		if request.GET.get('addition'):
			condition_a = condition_a & (Q(addition__icontains=request.GET.get('addition')))
		if request.GET.get('unit'):
			condition_a = condition_a & (Q(unit__icontains=request.GET.get('unit')))
		if request.GET.get('block'):
			condition_a = condition_a & (Q(block__icontains=request.GET.get('block')))
		if request.GET.get('lot'):
			condition_a = condition_a & (Q(lot__icontains=request.GET.get('lot')))
		if request.GET.get('plot'):
			condition_a = condition_a & (Q(plot__icontains=request.GET.get('plot')))

		assets_all = MasterGeom.objects.filter(condition_a)
		assets = assets_all.order_by('-id')[st_index: ed_index]

		total = assets_all.count()

		data = serialize('geojson', assets, geometry_field='geom')
		data = json.loads(data)

		for feat in data['features']:
			feat['properties']['cemetery_plot_form'] = None
			cp_form = CemeteryPlotForm.objects.filter(geom=feat['properties']['pk'])
			if cp_form.exists():
				cp_form = cp_form.get()
				feat['properties']['cemetery_plot_form'] = CemeteryPlotFormSerializer(cp_form).data

		# print("Total:", total, condition_a)

		bbox = None
		with connection.cursor() as cursor:
			assets_all_ids = list(assets_all.values_list('id', flat=True))

			if len(assets_all_ids):
				sql = "SELECT min(ST_XMin(geom)) as l, min(ST_YMin(geom)) as b, max(ST_XMax(geom)) as r, max(ST_YMax(geom)) as t from master_geom where id IN %s" % assets_all_ids
				sql = sql.replace('[', '(').replace(']', ')')

				cursor.execute(sql)
				res = cursor.fetchone()
				flag = False
				for item in res:
					if item == None:
						flag = True
				if flag == False:
					bbox = list(res)
				print (bbox)

		return Response({'geojson': data, 'total': total, 'bbox': bbox})

class getVectorTile(APIView):
	permission_classes = []
	def get(self, request, zoom, x, y):
		condition_a = ~Q(geom=None)

		with connection.cursor() as cursor:
			search_field = MasterGeom.objects.filter(condition_a).query
			search_field = str(search_field).split("WHERE")[1].strip()
			search_field = search_field.replace("LIKE UPPER(", "LIKE UPPER('").replace("(%", "('%").replace("%)", "%')")

			# sql = "SELECT ST_AsMVT(tile) FROM (SELECT id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)), unit, block, lot, plot from master_geom where %s and ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, search_field, zoom, x, y)

			sql = "SELECT ST_AsMVT(tile) FROM (SELECT master_geom.id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)), unit, block, lot, plot, first_name, last_name from master_geom LEFT JOIN cemetery_plot_form ON master_geom.id=cemetery_plot_form.geom_id where %s and ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, search_field, zoom, x, y)

			# if condition_a:
			# 	search_field = MasterGeom.objects.filter(condition_a).query
			# 	search_field = str(search_field).split("WHERE")[1].strip()
			# 	search_field = search_field.replace("LIKE UPPER(", "LIKE UPPER('").replace("(%", "('%").replace("%)", "%')")

			# 	sql = "SELECT ST_AsMVT(tile) FROM (SELECT id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)), unit, block, lot, plot from master_geom where %s and ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, search_field, zoom, x, y)
			# 	print (sql)
			# else:
			# 	sql = "SELECT ST_AsMVT(tile) FROM (SELECT id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)), unit, block, lot, plot from master_geom where ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, zoom, x, y)

			cursor.execute(sql)
			tile = bytes(cursor.fetchone()[0])
			if not len(tile):
				raise Http404()
		return HttpResponse(tile, content_type="application/x-protobuf")

class getAssetsFromPoint(APIView):
	# get assets from location
	permission_classes = [IsAuthenticated, ]
	def get(self, request):
		condition_a = ~Q(geom=None)

		pnt = Point(float(request.GET.get('lng')), float(request.GET.get('lat')))

		condition_a = condition_a & Q(geom__distance_lte=(pnt, 0.25))
		assets = MasterGeom.objects.filter(condition_a)

		print("assets found =>", assets.count())
		
		serializer = MasterGeomSerializer(assets, many=True)

		return Response(serializer.data)

# function to generate csv file
class AssetCSVDownload(APIView):
	permission_classes = [IsAuthenticated, ]
	def get(self, request):
		condition_a = Q()

		mapped = request.GET.get('mapped', 'true')

		is_mapped = False
		if mapped == 'true':
			is_mapped = True

		if request.GET.get('bound') and request.GET.get('gf') == None:
			poly = Polygon.from_bbox(tuple(request.GET.get('bound').split(',')))
			if is_mapped:
				condition_a = Q(geom__contained=poly) 
			else:
				condition_a = ~Q(geom__contained=poly)

		if request.GET.get('direction'):
			column = request.GET.get('column') if request.GET.get('direction') == 'asc' else '-' + request.GET.get('column')
			assets = MasterGeom.objects.filter(condition_a).order_by(column)
		else:
			assets = MasterGeom.objects.filter(condition_a)

		file_name = uuid.uuid4()
		# create a directory for wrapping all data
		#os.mkdir("%s/upload/%s" % (DIR_PATH, file_name))

		DIR_PATH = '.'

		file_path = "%s/upload/plots_%s.csv" % (DIR_PATH, file_name)
		with open(file_path, "w") as fp:
			writer = csv.writer(fp)
			writer.writerow(['ID', 'OGC_FID', 'First Name', 'Last Name', 'Middle Name', 'Suffix', 'Maiden Name', 'County', 'Addition', 'Unit', 'Block', 'Lot', 'Plot'])
			for asset in assets:
				cp = CemeteryPlotForm.objects.filter(geom=asset)
				if not cp.exists():
					cp = CemeteryPlotForm()
				else:
					cp = cp.get()
				data = [asset.id, asset.ogc_fid, cp.first_name, cp.last_name, cp.middle_name, cp.suffix, cp.maiden_name, asset.county, asset.addition, asset.unit, asset.block, asset.lot, asset.plot]
				writer.writerow(data)
			fp.close()

		fp = open(file_path, 'r')
		response = HttpResponse(fp, content_type='text/csv')
		response['Content-Disposition'] = 'attachment; filename=plots.csv'

		os.remove(file_path)

		return response

# api to get/update an asset/plot
class CemeteryPlotFormDetail(APIView):
	permission_classes = []

	def get_object(self, pk):
		try:
			return MasterGeom.objects.get(pk=pk)
		except:
			raise Http404

	def get(self, request, pk, format=None):
		try:
			asset = self.get_object(pk)
			cemetery_plot_form = CemeteryPlotForm.objects.filter(geom=asset)

			# if this asset does not have
			if cemetery_plot_form.exists():
				cemetery_plot_form = cemetery_plot_form.get()
			else:
				cemetery_plot_form = CemeteryPlotForm(first_name='', last_name='', middle_name='', suffix='', maiden_name='')
				cemetery_plot_form.author = request.user
				cemetery_plot_form.geom = asset
				cemetery_plot_form.save()

			serializer = MasterGeomSerializer(asset)

			return Response(serializer.data)
		except Exception as ex:
			print(ex)
			raise Http404

	def put(self, request, pk, format=None):
		asset = self.get_object(pk)
		cemetery_plot_form = asset.cemetery_plot_form
		
		cp_form_serializer = CemeteryPlotFormSerializer(cemetery_plot_form, data=request.data)

		if cp_form_serializer.is_valid():
			cp_form_serializer.save(author=self.request.user)
			return Response(cp_form_serializer.data)
		
		return Response(cp_form_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	# def delete(self, request, pk, format=None):
	# 	asset = self.get_object(pk)
	# 	asset.delete()

	# 	return Response({"pk": pk})


class LegalData(APIView):
	permission_classes = []

	def post(self, request, format=None):
		result_set = []

		county = request.data.get("county", None)
		type_val = request.data.get("type", None)

		# res = MasterGeom.objects.filter(county=county.upper()).distinct('county')
		if county:
			res = MasterGeom.objects.filter(county__iexact=county.lower())
		else:
			res = MasterGeom.objects.all()

		if type_val == "county" or type_val == "addition":
			res = res.distinct(type_val)	
		elif type_val == "unit":
			addition = request.data.get("addition", "")
			res = res.filter(addition__iexact=addition.lower()).distinct(type_val)
		elif type_val == "block":
			addition = request.data.get("addition", "")
			unit = request.data.get("unit", "")
			res = res.filter(addition__iexact=addition.lower(), unit__iexact=unit.lower()).distinct(type_val)
		elif type_val == "lot":
			addition = request.data.get("addition", "")
			unit = request.data.get("unit", "")
			block = request.data.get("block", "")
			res = res.filter(addition__iexact=addition.lower(), unit__iexact=unit.lower(), 
								block__iexact=block.lower()).distinct(type_val)
		elif type_val == "plot":
			addition = request.data.get("addition", "")
			unit = request.data.get("unit", "")
			block = request.data.get("block", "")
			lot = request.data.get("lot", "")
			res = res.filter(addition__iexact=addition.lower(), unit__iexact=unit.lower(), 
								block__iexact=block.lower(), lot__iexact=lot.lower()).distinct(type_val)
		
		for mg in res.values():
			if mg == None:
				continue
			result_set.append(mg[type_val])

		return HttpResponse(json.dumps(result_set), content_type='application/json')

class LoadCounties(APIView):
	permission_classes = []

	def get(self, request, format=None):
		result_set = []
		counties = MasterGeom.objects.distinct('county')

		for county in counties:
			if county == None:
				continue
			result_set.append(county.county)
		return HttpResponse(json.dumps(result_set), content_type='application/json')

def sign_url(input_url=None, secret=None):
	if not input_url or not secret:
		raise Exception("Both input_url and secret are required")

	url = urlparse.urlparse(input_url)

	# We only need to sign the path+query part of the string
	url_to_sign = url.path + "?" + url.query

	# Decode the private key into its binary format
	# We need to decode the URL-encoded private key
	decoded_key = base64.urlsafe_b64decode(secret)

	# Create a signature using the private key and the URL-encoded
	# string using HMAC SHA1. This signature will be binary.
	signature = hmac.new(decoded_key, str(url_to_sign).encode('utf-8'), hashlib.sha1)

	# Encode the binary signature into base64 for use within a URL
	encoded_signature = base64.urlsafe_b64encode(signature.digest())

	original_url = url.scheme + "://" + url.netloc + url.path + "?" + url.query

	# Return signed URL
	return original_url + "&signature=" + encoded_signature.decode("utf-8")

class StreetView(APIView):
	permission_classes = []

	def get(self, request, pk, format=None):
		post = get_object_or_404(CemeteryPlotForm, pk=pk)
		streetview = ""
		if post.geom:
			streetview = sign_url("https://maps.googleapis.com/maps/api/streetview?location=%s,%s&size=600x300&key=%s" % (post.geom.y, post.geom.x, GOOGLE_KEY), SECRET_KEY)

		return HttpResponse(json.dumps({'url': streetview}), content_type='application/json')

# class TicketCount(APIView):
# 	permission_classes = [IsAuthenticated, ]

# 	def get(self, request, format=None):
# 		print (request.GET.get('count'))
# 		openCount = 0
		
# 		if request.GET.get('count'):
# 			condition = Q()
# 			globalf = Q()
# 		return Response({"count": openCount})


# api to get and update a user
class CustomUserDetail(APIView):
	permission_classes = [IsAuthenticated, ]

	def get_object(self, pk):
		try:
			return CustomUser.objects.get(pk=pk)
		except CustomUser.DoesNotExist:
			raise Http404

	def get(self, request, pk, format=None):
		customuser = self.get_object(pk)
		serializer = CustomUserSerializer(customuser)
		return Response(serializer.data)

	def put(self, request, pk, format=None):
		user = self.get_object(pk)
		password = None

		if 'password' in request.data and request.data['password'] != "":
			password = request.data['password']
			del request.data['password']

		serializer = CustomUserSerializer(user, data=request.data)
		if serializer.is_valid():
			serializer.save()

			# update the password
			if password and password != "":
				# try:
				# 	validators.validate_password(password=password)
				# except exceptions.ValidationError as e:
				# 	raise serializers.ValidationError(list(e.messages), serializer)
				
				user = self.get_object(pk)
				user.set_password(password)
				user.save()

			return Response(serializer.data)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, pk, format=None):
		user = self.get_object(pk)
		user.delete()

		return Response({"pk": pk})

class Dashboard(APIView):
	permission_classes = [IsAuthenticated, ]

	def get(self, request, format=None):
		res = []
		resByJoinType = []
		unmapped_total = 0
		recent = []
		
		return Response({
			'collection': res,
			'join_type': resByJoinType,
			'recent': recent,
			'unmapped': unmapped_total
		})

	def post(self, request, format=None):
		date = datetime.today() - relativedelta(months=12)
		result = dict()

		labels = []
		for index in range(12, 0, -1):
			dt = datetime.today() - relativedelta(months=index)
			labels.append(dt.strftime('%b'))

		return Response({'data': result, 'labels': labels})

class getLocation(APIView):
	permission_classes = [IsAuthenticated, ]

	def post(self, request, format=None):
		if self.request.data['join_type'] == 'residential':
			join_field = "\\".join([self.request.data['county'], self.request.data['sub_name'], self.request.data['sub_unit'], self.request.data['sub_block'], self.request.data['sub_lot']])
		elif self.request.data['join_type'] == 'rural':
			join_field = "\\".join([self.request.data['county'], self.request.data['rural_survey'], self.request.data['rural_block'], self.request.data['rural_section']])
		else:
			join_field = "\\".join([self.request.data['county'], self.request.data['plss_meridian'], self.request.data['plss_t_r'], self.request.data['plss_section']])

		try:
			geom = MasterGeom.objects.filter(join_field__iexact=join_field)[0].geom
			geom = GEOSGeometry(geom)
			geom = [geom.x, geom.y]
		except:
			geom = []

		return Response({'location': geom})

class KMZFiles(APIView):
	permission_classes = [IsAuthenticated, ]

	def post(self, request, format=None):
		print (request.FILES)

		print ('>>>>>>>>>>>>', os.popen('pwd').read())
		try:
			os.remove('/home/ubuntu/Furman-2/myapp/data/doc.kml')
		except:
			pass

		cmd = '''ogr2ogr -append -f "PostgreSQL" PG:"host=20.115.96.36 user=postgres password=%&828NSgBp^9 dbname=furmanrecords-2" data/doc.kml -nlt MULTILINESTRING -skipfailures -nln form'''
		up_file = request.FILES['file']
		path = '/home/ubuntu/Furman-2/myapp/data/' + up_file.name
		destination = open(path, 'wb+')
		for chunk in up_file.chunks():
			destination.write(chunk)
		destination.close()

		os.system("unzip %s -d /home/ubuntu/Furman-2/myapp/data/" % path)
		cmd = '''ogrinfo -al -geom=wkt data/doc.kml'''
		res = os.popen(cmd).read()

		return Response({'res': res})
