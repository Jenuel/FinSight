from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReconciliationSessionViewSet

router = DefaultRouter()
router.register(r'reconciliations', ReconciliationSessionViewSet, basename='reconciliation')

urlpatterns = [
    path('', include(router.urls)),
]
