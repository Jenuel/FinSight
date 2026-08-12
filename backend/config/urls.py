"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import logging

from django.contrib import admin
from django.urls import path, include
from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Liveness + readiness probe for the platform's health check.

    Touches the database, because a process that is up but cannot reach Postgres
    is not healthy - reporting 200 in that state would keep a broken instance in
    the load balancer. Deliberately returns no version, settings, or error
    detail: this endpoint is public, so it must not become a recon surface.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except Exception:
        logger.exception('Health check failed: database is unreachable')
        return Response(
            {'status': 'unhealthy'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({'status': 'healthy'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/', include('accounts.urls')),
    path('api/', include('transactions.urls')),
    path('api/', include('reconciliation.urls')),
]

