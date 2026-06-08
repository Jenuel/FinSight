from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CashAccountViewSet

router = DefaultRouter()
router.register(r'accounts', CashAccountViewSet, basename='cash-account')

urlpatterns = [
    path('', include(router.urls)),
]