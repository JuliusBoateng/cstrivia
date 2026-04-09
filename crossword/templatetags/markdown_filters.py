from django import template
from django.utils.safestring import mark_safe
import markdown

register = template.Library()


@register.filter
def render_markdown(text):
    if not text:
        return ""

    html = markdown.markdown(
        text,
        extensions=["fenced_code", "tables"]
    )

    return mark_safe(html)
