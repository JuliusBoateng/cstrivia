from django.test import TestCase
from crossword.models import Clue


class TestClues(TestCase):
    def test_clues(self):
        clue = Clue(
            question="This is a test question",
            display_answer="ANSWER",
            normalized_answer="ANSWER",
        )
        clue.full_clean()
        clue.save()

    # question = models.CharField(max_length=150)
    # display_answer = models.CharField(max_length=21)  # Keep diacritics
    # normalized_answer = models.CharField(
    #     max_length=21, editable=False
    # )  # derived field. diacritics removed
    # anagram = models.CharField(max_length=21, null=True, blank=True)
    # categories = models.ManyToManyField(Category, related_name="clues", blank=True)
