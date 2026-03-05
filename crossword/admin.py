from django.contrib import admin
from crossword import models

# Register your models here.
admin.site.register(models.Category)
admin.site.register(models.Board)
admin.site.register(models.Clue)
admin.site.register(models.CluePlacement)