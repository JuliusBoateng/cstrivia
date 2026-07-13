import re

from django.utils.text import Truncator


def markdown_intro(markdown: str) -> str:
    intro = _extract_intro(markdown)
    intro = " ".join(_strip_markdown(intro).split())
    return Truncator(intro).words(50)

def _extract_intro(markdown):
    for line in markdown.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            return line
    return ""


def _strip_markdown(text):
    # converts markdown links to plain text
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)

    # removes basic formatting like *italic*, **bold**, and `code`
    text = re.sub(r"[*_`]", "", text)

    # collapse whitespace
    text = re.sub(r"\s+", " ", text)

    return text.strip()