"""
URL configuration for Smart Learners AI backend project.
"""
from django.contrib import admin
from django.urls import path, include
from authentication.urls import ai_urlpatterns

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/ai/', include(ai_urlpatterns)),
]
