from django.contrib import admin
from crossword import models

# Register your models here.
@admin.register(models.Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(models.Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = (
        "puzzle_number",
        "title",
        "author",
        "published_at",
        "updated_at",
    )
    search_fields = ("title", "description", "author")
    list_filter = ("published_at", "categories")
    filter_horizontal = ("categories",)
    ordering = ("puzzle_number",)


@admin.register(models.CluePlacement)
class CluePlacementAdmin(admin.ModelAdmin):
    list_display = (
        "board",
        "clue",
        "direction",
        "start_row",
        "start_col",
    )
    list_filter = ("direction", "board")
    search_fields = ("clue__question", "clue__display_answer", "board__title")


@admin.register(models.DesignCategory)
class DesignCategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(models.DesignNote)
class DesignNoteAdmin(admin.ModelAdmin):
    list_display = (
        "design_number",
        "title",
        "author",
        "published_at",
        "updated_at",
    )
    search_fields = ("title", "body", "author")
    list_filter = ("published_at", "categories", "boards")
    filter_horizontal = ("boards", "categories")
    ordering = ("design_number",)
