from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..models import DesignNote
from ..api.service import get_design_note

PAGINATION_LIMIT = 10

@method_decorator(never_cache, name="dispatch")
class DesignNoteListView(ListView):
    model = DesignNote
    template_name = "crossword/design_index.html"
    context_object_name = "notes"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return (
            DesignNote.objects
            .filter(published_at__lte=timezone.now())
            .order_by("-design_number")
            .prefetch_related("boards", "categories")
        )

@never_cache
def design_note_view(request, design_number: int):
    note = get_design_note(design_number)
    return render(request, "crossword/design_note.html", {"note": note})
