from django.urls import path
from . import views 

urlpatterns = [
    path('', views.home, name='home'),
    path('api/products/', views.product_api, name='product_api'),
    path('api/hero-slider/', views.hero_slider_api, name='hero_slider_api'),
    path('api/orders/create/', views.create_order, name='create_order'),
]