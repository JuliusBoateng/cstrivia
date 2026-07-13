from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..api.service import get_exhibit
from ..models import Exhibit
from .markdown_utils import markdown_intro

PAGINATION_LIMIT = 10


@method_decorator(never_cache, name="dispatch")
class ExhibitListView(ListView):
    model = Exhibit
    template_name = "crossword/exhibit_list.html"
    context_object_name = "exhibits"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return (
            Exhibit.objects.filter(published_at__lte=timezone.now())
            .order_by("-exhibit_number")
            .prefetch_related("categories")
        )


@never_cache
def exhibit_view(request, exhibit_number: int):
    exhibit = get_exhibit(exhibit_number)
    meta_description = build_exhibit_description(exhibit)

    return render(
        request,
        "crossword/exhibit.html",
        {
            "exhibit": exhibit,
            "meta_description": meta_description,
        },
    )


def build_exhibit_description(exhibit: Exhibit):
    intro = markdown_intro(exhibit.body)

    if intro:
        return intro

    return (
        f"Exhibit {exhibit.exhibit_number}: {exhibit.title}. "
        "Images of interesting computer science artifacts."
    )
