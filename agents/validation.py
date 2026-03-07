import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any

from .content import DraftArticle, MIN_WORDS


@dataclass
class ValidationResult:
    draft: DraftArticle
    approved: bool
    reasons: List[str]


class ValidationAgent:
    """
    Lightweight validation to keep content human-like and safe for SEO indexing.

    This module deliberately avoids any network calls. It focuses on:
      - Structure checks (headings, sections, FAQs)
      - Length checks (minimum word count)
      - Tone checks via simple heuristics
      - Adding inline "citation-style" placeholders
    """

    def __init__(self, data_dir: Path, posts_dir: Path) -> None:
        self.data_dir = Path(data_dir)
        self.posts_dir = Path(posts_dir)

    def _has_required_structure(self, content: str) -> bool:
        has_h2 = "## " in content
        has_faq = "## Frequently asked questions" in content
        has_table = "|" in content and "---" in content
        return has_h2 and has_faq and has_table

    def _word_count(self, content: str) -> int:
        return len(content.split())

    _AI_PATTERN_PHRASES = [
        "as an ai language model",
        "in conclusion, in conclusion",
        "lorem ipsum",
        "in this comprehensive guide",
        "it's worth noting that",
        "it is important to note",
        "without further ado",
        "in today's rapidly evolving",
        "dive deep into",
        "delve into",
    ]

    _PLACEHOLDER_PATTERNS = [
        "Tool B",
        "Tool A",
        "Component A version",
        "Component B version",
    ]

    def _looks_human_like(self, content: str) -> bool:
        lower = content.lower()
        return not any(p in lower for p in self._AI_PATTERN_PHRASES)

    def _has_placeholder_text(self, content: str) -> bool:
        """Detect unresolved template placeholders."""
        return any(p in content for p in self._PLACEHOLDER_PATTERNS)

    def _has_duplicated_paragraphs(self, content: str) -> bool:
        """Detect paragraphs repeated 2+ times (the padding bug)."""
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        seen = set()
        for p in paragraphs:
            # Normalise whitespace for comparison
            normalised = " ".join(p.split())
            if len(normalised) > 80 and normalised in seen:
                return True
            seen.add(normalised)
        return False

    def _add_inline_citations(self, content: str) -> str:
        """
        Naive "citation" injection: append contextual reference hints to
        some headings. These are not external links, but cues for future
        manual curation.
        """
        replacements = {
            # devtools_comparison headings
            "## Head-to-head feature comparison": "## Head-to-head feature comparison [internal notes]",
            "## Common failure modes": "## Common failure modes [field experience]",
            # compatibility headings
            "## Known issues and workarounds": "## Known issues and workarounds [internal notes]",
            "## Tested version matrix": "## Tested version matrix [field experience]",
            # tutorial headings
            "## Common errors and how to fix them": "## Common errors and how to fix them [internal notes]",
            # foreign_news headings
            "## Technical analysis": "## Technical analysis [internal notes]",
            # legacy headings (kept for backwards compatibility with existing articles)
            "## Core concepts and mental models": "## Core concepts and mental models [internal notes]",
            "## Implementation guidelines and failure modes": "## Implementation guidelines and failure modes [field experience]",
        }
        for old, new in replacements.items():
            content = content.replace(old, new)
        return content

    def _enrich_context(self, content: str) -> str:
        """Add one short contextual paragraph near the top."""
        paragraphs = content.split("\n\n")
        if len(paragraphs) < 2:
            return content
        context = (
            "From a practical standpoint, treat this guide as a set of guardrails "
            "rather than a script. You are encouraged to adapt the examples to the "
            "constraints of your own organisation, regulatory environment, and risk appetite."
        )
        paragraphs.insert(2, context)
        return "\n\n".join(paragraphs)

    def _rejects_keyword_stuffing(self, content: str, keyword: str) -> bool:
        if not keyword:
            return False
        pattern = re.escape(keyword.lower())
        count = len(re.findall(pattern, content.lower()))
        # Rough heuristic: keyword used more than 15 times is suspicious.
        return count > 15

    def validate(self, draft: DraftArticle) -> ValidationResult:
        reasons: List[str] = []

        if self._word_count(draft.content) < MIN_WORDS:
            reasons.append("content too short")

        if not self._has_required_structure(draft.content):
            reasons.append("missing structural sections (H2/H3/table/FAQ)")

        if not self._looks_human_like(draft.content):
            reasons.append("content appears machine-like from simple heuristics")

        if self._rejects_keyword_stuffing(draft.content, draft.title):
            reasons.append("potential keyword stuffing detected")

        if self._has_placeholder_text(draft.content):
            reasons.append("unresolved template placeholder detected")

        if self._has_duplicated_paragraphs(draft.content):
            reasons.append("duplicated paragraphs detected")

        approved = len(reasons) == 0
        return ValidationResult(draft=draft, approved=approved, reasons=reasons)

    def run(self, drafts: List[DraftArticle]) -> List[DraftArticle]:
        approved_drafts: List[DraftArticle] = []
        for draft in drafts:
            result = self.validate(draft)
            if not result.approved:
                # For now we simply skip low quality drafts. They remain available
                # in the logs if you choose to inspect them manually.
                continue
            updated_content = self._add_inline_citations(draft.content)
            updated_content = self._enrich_context(updated_content)
            draft.content = updated_content
            approved_drafts.append(draft)
        return approved_drafts


__all__ = ["ValidationAgent", "ValidationResult"]

