from django.contrib import admin
from criss_cross import models

# Register your models here.
admin.site.register(models.Category)
admin.site.register(models.Board)
admin.site.register(models.Clue)
admin.site.register(models.CluePlacement)
admin.site.register(models.ClueCell)