from django.contrib import admin

from crossword import models

# Register your models here.


@admin.register(models.Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


class PlacementInline(admin.TabularInline):
    model = models.Placement
    extra = 1
    fields = ("clue", "start_row", "start_col", "direction")
    ordering = ("start_row", "start_col", "direction")


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
    inlines = [PlacementInline]


@admin.register(models.Clue)
class ClueAdmin(admin.ModelAdmin):
    list_display = (
        "board",
        "question",
        "normalized_answer",
        "display_answer",
    )
    list_filter = ("board",)

    search_fields = (
        "board__title",
        "question",
        "normalized_answer",
        "display_answer",
    )
    ordering = ("board", "display_answer")


@admin.register(models.Placement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = (
        "board",
        "clue",
        "start_row",
        "start_col",
        "direction",
    )
    list_filter = ("direction", "board")
    search_fields = ("board__title", "clue__question", "clue__display_answer")
    ordering = ("board", "start_row", "start_col", "direction")


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
