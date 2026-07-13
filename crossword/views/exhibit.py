from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.generic import ListView

from ..models import Exhibit

PAGINATION_LIMIT = 10


@method_decorator(never_cache, name="dispatch")
class ExhibitListView(ListView):
    model = Exhibit
    template_name = "crossword/exhibit.html"
    context_object_name = "exhibits"
    paginate_by = PAGINATION_LIMIT

    def get_queryset(self):
        return (
            Exhibit.objects.filter(published_at__lte=timezone.now())
            .order_by("-exhibit_number")
            .prefetch_related("categories")
        )
