
from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..api.service import get_design_note
from ..models import DesignNote
from .markdown_utils import markdown_intro

PAGINATION_LIMIT = 10


@method_decorator(never_cache, name="dispatch")
class DesignNoteListView(ListView):
    model = DesignNote
    template_name = "crossword/design_list.html"
    context_object_name = "notes"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return (
            DesignNote.objects.filter(published_at__lte=timezone.now())
            .order_by("-design_number")
            .prefetch_related("boards", "categories")
        )


@never_cache
def design_note_view(request, design_number: int):
    note = get_design_note(design_number)
    meta_description = build_design_note_description(note)

    return render(
        request,
        "crossword/design_note.html",
        {"note": note, "meta_description": meta_description},
    )


def build_design_note_description(note: DesignNote):
    intro = markdown_intro(note.body)

    if intro:
        return intro

    return (
        f"Design Note {note.design_number}: {note.title}. "
        "Notes on puzzle construction and design decisions."
    )
