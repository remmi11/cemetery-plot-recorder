from django.shortcuts import render, get_object_or_404
from django.db.models import Q, Sum, Count
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


# DIR_PATH = "/home/wolf/Noah/furman_update/dev/myapp"
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
		
		page = int(request.GET.get('page', 1))
		st_index = (page - 1) * 50
		ed_index = page * 50

		isFilter = True
		if condition_a:
			isFilter = True

		if request.GET.get('bound') and request.GET.get('gf') == None:
			poly = Polygon.from_bbox(tuple(request.GET.get('bound').split(',')))
			condition_a = Q(geom__contained=poly) if request.GET.get('mapped', 'true') == 'true' else ~Q(geom__contained=poly)

		assets_all = MasterGeom.objects.filter(condition_a)
		assets = assets_all.order_by('-id')[st_index: ed_index]

		data = serialize('geojson', assets, geometry_field='geom')
		total = assets.count()
		data = json.loads(data)

		print("==========", total, condition_a, isFilter)

		bbox = None
		with connection.cursor() as cursor:
			print("inside cursor...")
			# if condition_a and isFilter:
			if isFilter:
				search_field = assets_all.query
				search_field = str(search_field).split("WHERE")[1].strip()
				search_field = search_field.replace("LIKE UPPER(", "LIKE UPPER('").replace("(%", "('%").replace("%)", "%')")

				print (search_field)
				sql = "SELECT min(ST_XMin(geom)) as l, min(ST_YMin(geom)) as b, max(ST_XMax(geom)) as r, max(ST_YMax(geom)) as t from master_geom where %s" % search_field
				# sql = "SELECT min(ST_XMin(geom)) as l, min(ST_YMin(geom)) as b, max(ST_XMax(geom)) as r, max(ST_YMax(geom)) as t from master_geom"

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
			if condition_a:
				search_field = MasterGeom.objects.filter(condition_a).query
				search_field = str(search_field).split("WHERE")[1].strip()
				search_field = search_field.replace("LIKE UPPER(", "LIKE UPPER('").replace("(%", "('%").replace("%)", "%')")

				sql = "SELECT ST_AsMVT(tile) FROM (SELECT id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) from master_geom where %s and ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, search_field, zoom, x, y)
				print (sql)
			else:
				sql = "SELECT ST_AsMVT(tile) FROM (SELECT id, ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) from master_geom where ST_AsMVTGeom(geom, TileBBox(%s, %s, %s, 4326)) is not null) AS tile" % (zoom, x, y, zoom, x, y)

			cursor.execute(sql)
			tile = bytes(cursor.fetchone()[0])
			#print (tile)
			if not len(tile):
				raise Http404()
		return HttpResponse(tile, content_type="application/x-protobuf")

class getAssta(APIView):
	permission_classes = [IsAuthenticated, ]
	def get(self, request):
		condition_a = ~Q(geom=None)

		pnt = Point(float(request.GET.get('lng')), float(request.GET.get('lat')))

		condition_a = condition_a & Q(geom__distance_lte=(pnt, 0.25))
		assets = MasterGeom.objects.filter(condition_a)

		print("assets found =>", assets.count(), list(assets), serialize('json', list(assets)))

		return HttpResponse(serialize('json', list(assets)), content_type="json")

# function to generate csv file
class AssetCSVDownload(APIView):
	permission_classes = [IsAuthenticated, ]
	def get(self, request):
		condition_a = Q()

		# filter assets by global and each columns
		if request.GET.get('global') and request.GET.get('global') != "":
			global_key = request.GET.get('global')
			temp = (Q(collection__icontains = global_key) |
				Q(project_no__icontains = global_key) |
				Q(client__icontains = global_key) |
				Q(map_no__icontains = global_key) |
				Q(contact_name__icontains = global_key) |
				Q(situs_street__icontains = global_key) |
				Q(situs_city__icontains = global_key) |
				Q(situs_state__icontains = global_key) |
				Q(county__icontains = global_key) |
				Q(rural_survey__icontains = global_key) |
				Q(rural_block__icontains = global_key) |
				Q(rural_section__icontains = global_key) |
				Q(sub_name__icontains = global_key) |
				Q(sub_unit__icontains = global_key) |
				Q(sub_block__icontains = global_key) |
				Q(sub_lot__icontains = global_key) |
				Q(plss_meridian__icontains = global_key) |
				Q(plss_t_r__icontains = global_key) |
				Q(plss_section__icontains = global_key) |
				Q(notes__icontains = global_key) |
				Q(requested_by__icontains = global_key) |
				Q(certify_to__icontains = global_key) |
				Q(gf_no__icontains = global_key) |
				Q(lender__icontains = global_key) |
				Q(certified_by__icontains = global_key) |
				Q(pid__icontains = global_key) |
				Q(aka__icontains = global_key) |
				Q(plat_no__icontains = global_key))

			condition_a = condition_a & temp

		condition_a = condition_a & (Q(collection__icontains=request.GET.get('collection'))) if request.GET.get('collection') else condition_a
		condition_a = condition_a & (Q(project_no__icontains=request.GET.get('project_no'))) if request.GET.get('project_no') else condition_a
		condition_a = condition_a & (Q(client__icontains=request.GET.get('client'))) if request.GET.get('client') else condition_a
		condition_a = condition_a & (Q(certified_by__icontains=request.GET.get('certified_by'))) if request.GET.get('certified_by') else condition_a
		condition_a = condition_a & (Q(certify_to__icontains=request.GET.get('certify_to'))) if request.GET.get('certify_to') else condition_a
		condition_a = condition_a & (Q(contact_name__icontains=request.GET.get('contact_name'))) if request.GET.get('contact_name') else condition_a
		condition_a = condition_a & (Q(map_no__icontains=request.GET.get('map_no'))) if request.GET.get('map_no') else condition_a
		condition_a = condition_a & (Q(contact_address__icontains=request.GET.get('contact_address'))) if request.GET.get('contact_address') else condition_a
		condition_a = condition_a & (Q(aka__icontains=request.GET.get('aka'))) if request.GET.get('aka') else condition_a
		condition_a = condition_a & (Q(well_name__icontains=request.GET.get('well_name'))) if request.GET.get('well_name') else condition_a
		condition_a = condition_a & (Q(well_number__icontains=request.GET.get('well_number'))) if request.GET.get('well_number') else condition_a

		condition_a = condition_a & (Q(join_type__icontains=request.GET.get('join_type'))) if request.GET.get('join_type') else condition_a
		condition_a = condition_a & (Q(county__icontains=request.GET.get('county'))) if request.GET.get('county') else condition_a
		condition_a = condition_a & (Q(rural_survey__icontains=request.GET.get('rural_survey'))) if request.GET.get('rural_survey') else condition_a
		condition_a = condition_a & (Q(rural_block__icontains=request.GET.get('rural_block'))) if request.GET.get('rural_block') else condition_a
		condition_a = condition_a & (Q(rural_section__icontains=request.GET.get('rural_section'))) if request.GET.get('rural_section') else condition_a
		condition_a = condition_a & (Q(plss_meridian__icontains=request.GET.get('plss_meridian'))) if request.GET.get('plss_meridian') else condition_a
		condition_a = condition_a & (Q(plss_t_r__icontains=request.GET.get('plss_t_r'))) if request.GET.get('plss_t_r') else condition_a
		condition_a = condition_a & (Q(plss_section__icontains=request.GET.get('plss_section'))) if request.GET.get('plss_section') else condition_a
		condition_a = condition_a & (Q(sub_name__icontains=request.GET.get('sub_name'))) if request.GET.get('sub_name') else condition_a
		condition_a = condition_a & (Q(sub_unit__icontains=request.GET.get('sub_unit'))) if request.GET.get('sub_unit') else condition_a
		condition_a = condition_a & (Q(sub_block__icontains=request.GET.get('sub_block'))) if request.GET.get('sub_block') else condition_a
		condition_a = condition_a & (Q(sub_lot__icontains=request.GET.get('sub_lot'))) if request.GET.get('sub_lot') else condition_a
		condition_a = condition_a & (Q(situs_street__icontains=request.GET.get('situs_street'))) if request.GET.get('situs_street') else condition_a
		condition_a = condition_a & (Q(notes__icontains=request.GET.get('notes'))) if request.GET.get('notes') else condition_a
		condition_a = condition_a & (Q(aka__icontains=request.GET.get('aka'))) if request.GET.get('aka') else condition_a
		condition_a = condition_a & (Q(plat_no__icontains=request.GET.get('plat_no'))) if request.GET.get('plat_no') else condition_a

		if request.GET.get('bound') and request.GET.get('gf') == None:
			poly = Polygon.from_bbox(tuple(request.GET.get('bound').split(',')))
			condition_a = condition_a & Q(geom__contained=poly) if request.GET.get('mapped', 'true') == 'true' else condition_a & ~Q(geom__contained=poly)

		if request.GET.get('direction'):
			column = request.GET.get('column') if request.GET.get('direction') == 'asc' else '-' + request.GET.get('column')
			assets = CemeteryPlot.objects.filter(condition_a).order_by(column)
		else:
			assets = CemeteryPlot.objects.filter(condition_a)

		file_name = uuid.uuid4()
		# create a directory for wrapping all data
		#os.mkdir("%s/upload/%s" % (DIR_PATH, file_name))

		file_path = "%s/upload/assets_%s.csv" % (DIR_PATH, file_name)
		with open(file_path, "w") as fp:
			writer = csv.writer(fp)
			writer.writerow(['ID', 'Collection', 'Project No', 'Client', 'Surveyor', 'Certify To', 'Map No', 'County', 'Address', 'Survey', 'Block', 'Section', 'Subdivision', 'Unit', 'Block', 'Lot', 'Meridian', 'T/R', 'Section', 'Notes', 'AKA', 'Plat No'])
			for asset in assets:
				data = [asset.id, asset.collection, asset.project_no, asset.client, asset.certified_by, asset.certify_to, asset.map_no, asset.county, asset.contact_address, asset.rural_survey, asset.rural_block, asset.rural_section, asset.sub_name, asset.sub_unit, asset.sub_block, asset.sub_lot, asset.plss_meridian, asset.plss_t_r, asset.plss_section, asset.notes, asset.aka, asset.plat_no]
				writer.writerow(data)

			fp.close()

		fp = open(file_path, 'r')
		response = HttpResponse(fp, content_type='text/csv')
		response['Content-Disposition'] = 'attachment; filename=assets.csv'

		os.remove(file_path)

		return response

# api to get/update/delete/duplicate a assetA
class CemeteryPlotDetail(APIView):
	permission_classes = []

	def get_object(self, pk):
		try:
			print("inside get_object...")
			return MasterGeom.objects.get(pk=pk)
		except:
			raise Http404

	def get(self, request, pk, format=None):
		try:
			print("inside get...")
			asset = self.get_object(pk)
			cemetery_plot = CemeteryPlot.objects.filter(ogc_fid=asset.ogc_fid).first()
			if not cemetery_plot:
				cemetery_plot = CemeteryPlot()
				cemetery_plot.ogc_fid = asset.ogc_fid
				cemetery_plot.county = asset.county
				cemetery_plot.addition = asset.addition
				cemetery_plot.unit = asset.unit
				cemetery_plot.block = asset.block
				cemetery_plot.lot = asset.lot
				cemetery_plot.plot = cemetery_plot.plot
				cemetery_plot.geom = asset.geom
				cemetery_plot.save()

			serializer = CemeteryPlotSerializer(cemetery_plot)
			return Response(serializer.data)
		except:
			raise Http404

	# def put(self, request, pk, format=None):
	# 	asset = self.get_object(pk)

	# 	queryset = CemeteryPlot.objects.filter(Q(project_no=request.data['project_no']) &  Q(collection=request.data['collection']) & ~Q(pk=pk))

	# 	print (">>>>>>>", queryset.exists(), request.data['project_no'], request.data['collection'])
	# 	if queryset.exists():
	# 		raise serializers.ValidationError('Project number is already existed.')

	# 	serializer = CemeteryPlotSerializer(asset, data=request.data)
	# 	if serializer.is_valid():
	# 		serializer.save()

	# 		isgeom = True
	# 		if request.data['join_type'] == 'residential':
	# 			join_field = "\\".join([request.data['county'], request.data['sub_name'], request.data['sub_unit'], request.data['sub_block'], request.data['sub_lot']])
	# 			if 'sub_lot' not in request.data or request.data['sub_lot'] == '' or request.data['sub_lot'] == None:
	# 				isgeom = False
	# 		elif self.request.data['join_type'] == 'rural':
	# 			join_field = "\\".join([request.data['county'], request.data['rural_survey'], request.data['rural_block'], request.data['rural_section']])
	# 			if 'rural_section' not in request.data or request.data['rural_section'] == '' or request.data['rural_section'] == None:
	# 				isgeom = False
	# 		else:
	# 			join_field = "\\".join([request.data['county'], request.data['plss_meridian'], request.data['plss_t_r'], request.data['plss_section']])
	# 			if 'plss_section' not in request.data or request.data['plss_section'] == '' or request.data['plss_section'] == None:
	# 				isgeom = False

	# 		if 'geom' in self.request.data and 'update_location' in self.request.data and self.request.data['update_location'] == 'pin':
	# 			serializer.save(geom=self.request.data['geom'])

	# 		print (join_field, isgeom)
	# 		try:
	# 			if isgeom and 'update_location' in self.request.data and self.request.data['update_location'] == 'legal':
	# 				geom = MasterGeom.objects.filter(join_field__iexact=join_field)[0].geom
	# 				serializer.save(geom=geom)
	# 		except:
	# 			geom = None

	# 		return Response(serializer.data)
	# 	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class AutoProjectNo(APIView):
	permission_classes = []

	def post(self, request, format=None):
		res = {}
		collection = request.data.get('collection', '').lower()
		with connection.cursor() as cursor:
			if collection in ['furman land surveyors, inc.', 'gdi, inc. - amarillo', 'gdi, inc. - canadian']:
				sql = "SELECT MAX(CAST(substring(project_no, 4) AS INT)) FROM form WHERE lower(collection) = '%s' and substring(project_no, 4) ~ E'^[0-9]+$'" % (collection)
			else:
				sql = "SELECT MAX(CAST(substring(project_no, 3) AS INT)) FROM form WHERE lower(collection) = '%s' and substring(project_no, 3) ~ E'^[0-9]+$'" % (collection)

			cursor.execute(sql)
			res = {'pid': cursor.fetchone()[0]}
		return HttpResponse(json.dumps(res), content_type='application/json')

class ClientData(APIView):
	permission_classes = []

	def get(self, request, format=None):
		try:
			data = []

			if request.GET.get('type') == 'clients':
				temp = CemeteryPlot.objects.all().distinct('client')
				data = [tp.client for tp in temp if tp.client != None]
			if request.GET.get('type') == 'certified_by':
				temp = CemeteryPlot.objects.all().distinct('certified_by')
				data = [tp.certified_by for tp in temp if tp.certified_by != None]
			if request.GET.get('type') == 'map_no':
				temp = CemeteryPlot.objects.all().distinct('map_no')
				data = [tp.map_no for tp in temp if tp.map_no != None and tp.map_no != ""]
			if request.GET.get('type') == 'project_no':
				temp = CemeteryPlot.objects.filter(project_no__icontains=request.GET.get('project_no')).distinct('project_no')
				data = [tp.project_no for tp in temp if tp.project_no != None and tp.project_no != ""]
			if request.GET.get('type') == 'lenders':
				temp = CemeteryPlot.objects.all().distinct('lender')
				data = [tp.lender for tp in temp if tp.lender != None]
			return HttpResponse(json.dumps(data), content_type='application/json')

		except:
			return HttpResponse(json.dumps(data), content_type='application/json')
			# raise Http404

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
		post = get_object_or_404(CemeteryPlot, pk=pk)
		streetview = ""
		if post.geom:
			streetview = sign_url("https://maps.googleapis.com/maps/api/streetview?location=%s,%s&size=600x300&key=%s" % (post.geom.y, post.geom.x, GOOGLE_KEY), SECRET_KEY)

		return HttpResponse(json.dumps({'url': streetview}), content_type='application/json')


class CemeteryPlotCreate(generics.ListCreateAPIView):
	queryset = CemeteryPlot.objects.all()
	serializer_class = CemeteryPlotSerializer
	permission_classes = []

	def get_queryset(self):
		pass

	def perform_create(self, serializer):
		# print("==============")
		geom = None
		serializer.save(geom=geom, author=self.request.user)


class TicketCount(APIView):
	permission_classes = [IsAuthenticated, ]

	def get(self, request, format=None):
		print (request.GET.get('count'))
		openCount = 0
		
		if request.GET.get('count'):
			condition = Q()
			globalf = Q()

		# 	if self.request.GET.get('global') and self.request.GET.get('global') != "":
		# 		global_filter = self.request.GET.get('filter')
		# 		globalf = globalf | (Q(address__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(subject__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(projectNo__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(accountNo__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(surveyType__icontains=global_filter)) if global_filter else condition
		# 		globalf = globalf | (Q(notes__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(response__icontains=global_filter)) if global_filter else globalf
		# 		globalf = globalf | (Q(status__icontains=global_filter)) if global_filter else globalf

		# 		condition = condition & globalf

		# 	condition = condition & (Q(projectNo__icontains=self.request.GET.get('projectNo'))) if self.request.GET.get('projectNo') else condition
		# 	condition = condition & (Q(subject__icontains=self.request.GET.get('subject'))) if self.request.GET.get('subject') else condition
		# 	condition = condition & (Q(surveyType__icontains=self.request.GET.get('surveyType'))) if self.request.GET.get('surveyType') else condition
		# 	condition = condition & (Q(address__icontains=self.request.GET.get('address'))) if self.request.GET.get('address') else condition
		# 	condition = condition & (Q(accountNo__icontains=self.request.GET.get('accountNo'))) if self.request.GET.get('accountNo') else condition
		# 	condition = condition & (Q(response__icontains=self.request.GET.get('response'))) if self.request.GET.get('response') else condition
		# 	condition = condition & (Q(status__icontains=self.request.GET.get('status'))) if self.request.GET.get('status') else condition
		# 	condition = condition & (Q(last_edited__username__icontains=self.request.GET.get('edit_user'))) if self.request.GET.get('edit_user') else condition
		# 	condition = condition & (Q(author__username__icontains=self.request.GET.get('author'))) if self.request.GET.get('author') else condition
		# 	condition = condition & (Q(notes__icontains=self.request.GET.get('notes'))) if self.request.GET.get('notes') else condition

		# 	openCount = Ticket.objects.filter(condition).count()
		# else:
		# 	openCount = Ticket.objects.filter(status='OPEN').count()

		return Response({"count": openCount})


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

		# for label in ['residential', 'rural', 'plss', 'route']:
		# 	resultByMonth = (
		# 		CemeteryPlot.objects
		# 			.filter(date_entered__gte=date, join_type=label)
		# 			.values_list('date_entered__year', 'date_entered__month')
		# 			.annotate(count=Count('id'))
		# 			.order_by('date_entered__year', 'date_entered__month')
		# 	)

		# 	res = dict()
		# 	for item in reversed(list(resultByMonth)):
		# 		dateStr = "%s-%s-01 00:00" % (item[0], item[1])
		# 		tp = [item[0], item[1], item[2], datetime.strptime(dateStr, "%Y-%m-%d %H:%M").strftime('%b')]
		# 		res[tp[3]] = tp[2]

		# 	print (res)
		# 	values = []
		# 	for lb in labels:
		# 		value = 0 if lb not in res.keys() else res[lb]
		# 		values.append(value)

		# 	result[label] = values

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


class getLegal(APIView):
	permission_classes = [IsAuthenticated, ]

	def get(self, request):
		lng = request.GET.get('lng')
		lat = request.GET.get('lat')
		res = None
		with connection.cursor() as cursor:
			sql = '''SELECT a.id, a.account_nu, a.join_type, a.county, a.subdivisio, a.unit_numbe, a.block_numb, a.lot_number, ST_AsText(a.geom) FROM master_geom a WHERE ST_INTERSECTS(ST_BUFFER(ST_TRANSFORM(ST_SetSRID(ST_Point(%s, %s),4326), 2275), 20), ST_TRANSFORM(a.geom, 2275)) AND a.join_type = \'residential\'''' % (lng, lat)

			print (sql)

			cursor.execute(sql)
			res = cursor.fetchone()
			return Response({'data': res})
		return Response({'data': None})

class TicketTotalCount(APIView):
	permission_classes = [IsAuthenticated, ]

	def get(self, request, format=None):
		openCount = Ticket.objects.all().count()

		return Response({"count": openCount})

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
