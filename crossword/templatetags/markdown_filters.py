from django import template
from django.utils.safestring import mark_safe
import markdown
import re

register = template.Library()


@register.filter
def render_markdown(text):
    if not text:
        return ""

    html = markdown.markdown(
        text,
        extensions=["fenced_code", "tables"]
    )

    # Add target="_blank" and rel attributes to links
    html = re.sub(
        r'<a href="(https?://.*?)">',
        r'<a href="\1" target="_blank" rel="noopener noreferrer">',
        html
    )

    return mark_safe(html)