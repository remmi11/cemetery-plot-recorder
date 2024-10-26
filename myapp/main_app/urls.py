from django.urls import path, include
from django.conf.urls import url
from . import views
from rest_framework_simplejwt import views as jwt_views

urlpatterns = [
    path('auth-user/', views.AuthView.as_view()),

    path('custom-users/', views.CustomUserCreate.as_view()),
    # path('collections/', views.CollectionCreate.as_view()),
    # path('meridians/', views.MeridianCreate.as_view()),
    # path('files/', views.KMZFiles.as_view()),

    path('users/<int:pk>/', views.CustomUserDetail.as_view()),

    path('geojson/', views.AssetGeoJson.as_view()),
    path('download/', views.AssetCSVDownload.as_view()),

    path('get-tile/<int:zoom>/<int:x>/<int:y>.mvt', views.getVectorTile.as_view()),
    path('token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
    path('get-asseta/', views.getAssta.as_view()),
    path('asset/<int:pk>/', views.CemeteryPlotDetail.as_view(), name='plot_detail'),
    path('asset_create/', views.CemeteryPlotCreate.as_view(), name='plot_create'),

    # path('ticket/<int:pk>/', views.TicketDetail.as_view()),
    # path('ticket_create/', views.TicketCreate.as_view()),
    path('ticket_count/', views.TicketCount.as_view()),
    path('dashboard/', views.Dashboard.as_view()),

    path('ajax_load_counties/', views.LoadCounties.as_view()),
    path('ajax_load_data/', views.LegalData.as_view()),
    path('ajax_data/', views.ClientData.as_view()),
    path('ajax_auto_pn/', views.AutoProjectNo.as_view()),
    url(r'get_pdf/(?P<pk>\d+)/', views.getpdf, name='get_pdf'),
    path('street_view/<int:pk>/', views.StreetView.as_view()),

    path('get_location/', views.getLocation.as_view()),
    path('ticket_total_count/', views.TicketTotalCount.as_view()),
    path('ajax_meridian/', views.TicketTotalCount.as_view()),
]
