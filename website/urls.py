"""
URL configuration for website project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
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
from django.contrib import admin
from django.urls import include, path
from django.http import HttpResponse
from django.contrib.sitemaps.views import sitemap
from django.conf import settings
from django.views.generic import RedirectView
from django.templatetags.static import static

from crossword.views.sitemap import get_sitemap_view


def healthz(request):
    return HttpResponse("ok", content_type="text/plain")

urlpatterns = [
    path("healthz/", healthz),
    path("sitemap.xml", sitemap, {"sitemaps": get_sitemap_view()}, name="sitemap"),
    path('', include("crossword.urls")),
    path("favicon.ico", RedirectView.as_view(url="/static/crossword/img/favicon-48.png", permanent=True))
]

if settings.DEBUG:
    from django.contrib import admin
    urlpatterns.append(path("admin/", admin.site.urls))
