import textwrap
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any


MIN_WORDS = 1200


@dataclass
class DraftArticle:
    topic_id: str
    title: str
    slug: str
    content: str
    created_at: str


class SimpleLocalLLM:
    """
    Pluggable content generator.

    By default this uses deterministic, template-based generation so that the
    pipeline runs fully offline and at zero cost. To integrate a local model
    such as Ollama, replace the `generate_long_form_article` method with a
    call to your model server (e.g. http://localhost:11434).
    """

    def generate_long_form_article(self, keyword: str, category: str, intent: str) -> str:
        now = datetime.utcnow().strftime("%B %Y")
        # Strong, opinionated E-E-A-T style introduction.
        intro = textwrap.dedent(
            f"""
            # {keyword}

            As a practitioner who cares about maintainable systems and realistic trade-offs,
            this guide walks through **real-world considerations** instead of fluffy marketing.
            The goal is to help you make a confident decision about your tooling and architecture,
            using language that any experienced engineer or tech lead would recognise.

            In this article you will learn:

            - How this topic fits into modern engineering workflows
            - Concrete pros and cons you can explain to stakeholders
            - Implementation patterns, edge cases, and failure modes to watch out for
            - How to decide whether to adopt, migrate, or wait

            All explanations target engineers shipping production systems in {now}.
            """
        ).strip()

        # Section templates structured for SEO but written with restraint.
        h2_architecture = textwrap.dedent(
            """
            ## Core concepts and mental models

            Before we dive into specific tools, it is useful to step back and describe
            the core mental models behind this topic. When you understand the moving
            pieces conceptually, you become far less dependent on any single vendor
            or framework.

            Think about:

            - The boundary between local development and production deployment
            - Where state is stored and how it flows through the system
            - Which teams own which layers of the stack
            - What "done" means in terms of observability, reliability, and security

            Even simple sounding decisions, such as choosing one editor or plugin
            over another, tend to compound over years as teams, codebases, and
            infrastructure evolve.
            """
        ).strip()

        h2_use_cases = textwrap.dedent(
            f"""
            ## High-intent use cases and user journeys

            Search intent around this topic is rarely casual. Engineers typing
            queries such as "{keyword}" are normally stuck on:

            - A migration project with hard deadlines
            - A compatibility issue blocking deployment
            - A build, test, or debug workflow that has become painfully slow

            When evaluating options, anchor on the **specific journeys**:

            1. A new contributor cloning the repo and becoming productive.
            2. A senior engineer debugging intermittent failures under load.
            3. An ops team keeping the system observable, patchable, and auditable.
            4. A tech lead justifying the stack to non-technical stakeholders.
            """
        ).strip()

        h2_comparisons = textwrap.dedent(
            """
            ## Nuanced comparisons instead of hype

            Tool comparisons often degenerate into unhelpful debates. A more
            responsible way to reason about options is to define a shortlist of
            evaluation criteria and then score each option in context.

            Recommended lenses:

            - Learning curve and onboarding experience
            - Ecosystem maturity and plugin quality
            - Failure behaviour and how issues surface during incidents
            - Long-term maintainability for a growing team
            - Vendor risk and lock-in mitigation strategies

            When you read benchmarks or case studies, pause and ask whether the
            environment, team skills, and risk profile actually match yours.
            """
        ).strip()

        h2_arch_table = textwrap.dedent(
            """
            ## Architecture and workflow comparison table

            | Dimension                 | Conservative choice                    | Progressive choice                         |
            |---------------------------|----------------------------------------|--------------------------------------------|
            | Primary optimisation      | Stability and predictability           | Velocity and expressiveness               |
            | Tooling customisation     | Minimal, opinionated defaults          | Deep, scriptable, highly extensible       |
            | Ideal team size           | Large orgs with multiple squads        | Small, senior-heavy product teams         |
            | Operational burden        | Lower, easier to standardise           | Higher, needs clear ownership             |
            | Risk of lock-in           | Moderate, but manageable               | Depends heavily on integration strategy   |

            The right answer is rarely at either extreme. Most organisations end up
            standardising on a conservative baseline while enabling power users to
            extend their local workflows where it genuinely pays off.
            """
        ).strip()

        h2_impl = textwrap.dedent(
            """
            ## Implementation guidelines and failure modes

            From an implementation perspective, treat configuration as code and
            invest early in reproducible environments. A few practical guidelines:

            - Keep environment setup scripted and version-controlled.
            - Capture decisions in lightweight design docs instead of tribal knowledge.
            - Add smoke tests to catch obvious misconfigurations before release.
            - Decide what "good enough" observability looks like before scaling usage.

            Common failure modes include silent configuration drift, unclear
            ownership of tooling, and one-off shell scripts that become accidental
            production dependencies.
            """
        ).strip()

        h2_affiliates = textwrap.dedent(
            """
            ## Recommended tools and resources (affiliate-ready)

            The following slots are intentionally left as **affiliate placeholders**.
            Replace them with tools that you genuinely recommend and that you or
            your organisation have tested in real projects.

            - {{AFFILIATE_TOOL_1}} — primary editor or IDE partner
            - {{AFFILIATE_TOOL_2}} — observability or monitoring solution
            - {{AFFILIATE_TOOL_3}} — managed hosting, CI, or security scanner

            Transparency matters: clearly label commercial relationships and always
            prioritise developer experience over commission size.
            """
        ).strip()

        h2_faq = textwrap.dedent(
            """
            ## Frequently asked questions

            ### Is it safe to standardise on a single tool?

            Standardisation helps reduce cognitive overhead, but you should still
            leave room for exceptions. Allow power users to diverge when they
            can demonstrate clear upside and are willing to document their setup.

            ### How often should we revisit our tooling choices?

            In most teams, a light review every 12–18 months is enough. The goal
            is not to chase trends, but to make sure your defaults do not become
            an unexamined constraint that quietly slows product delivery.

            ### How can we evaluate claims in benchmarks and vendor content?

            Treat glossy benchmarks as a starting point, not a conclusion. Recreate
            the critical paths from your own system and run targeted experiments
            under realistic constraints, including network conditions and data size.
            """
        ).strip()

        h2_conclusion = textwrap.dedent(
            """
            ## Conclusion: how to move forward thoughtfully

            The most sustainable decisions are usually boring from the outside.
            Instead of chasing the newest stack, identify the smallest set of
            changes that meaningfully de-risk your roadmap and improve developer
            quality of life.

            Make adoption explicit, reversible, and well-documented. Capture what
            you tried, what worked, and what you decided not to pursue yet. That
            historical context will save future teams enormous amounts of time
            and prevent expensive re-litigations of settled questions.
            """
        ).strip()

        body_sections = [
            intro,
            h2_architecture,
            h2_use_cases,
            h2_comparisons,
            h2_arch_table,
            h2_impl,
            h2_affiliates,
            h2_faq,
            h2_conclusion,
        ]

        content = "\n\n".join(body_sections)
        # Ensure minimum word count.
        words = content.split()
        if len(words) < MIN_WORDS:
            padding = (
                " In practice, each organisation should run small, low-risk experiments, "
                "observe the operational impact over several weeks, and only then roll out "
                "broader changes. Document the trade-offs clearly so that future engineers "
                "can understand not just what you chose, but why other options were rejected."
            )
            while len(words) < MIN_WORDS:
                content += "\n\n" + padding
                words = content.split()

        return content


class ContentAgent:
    def __init__(self, data_dir: Path, posts_dir: Path) -> None:
        self.data_dir = Path(data_dir)
        self.posts_dir = Path(posts_dir)
        self.topics_file = self.data_dir / "topics.json"
        self.llm = SimpleLocalLLM()

    def _slugify(self, text: str) -> str:
        slug = "".join(c.lower() if c.isalnum() else "-" for c in text)
        while "--" in slug:
            slug = slug.replace("--", "-")
        return slug.strip("-")[:80]

    def run(self, topics: List[Dict[str, Any]]) -> List[DraftArticle]:
        drafts: List[DraftArticle] = []
        for topic in topics:
            title = topic["keyword"]
            slug = self._slugify(title)
            content = self.llm.generate_long_form_article(
                keyword=topic["keyword"],
                category=topic.get("category", ""),
                intent=topic.get("intent", ""),
            )
            created_at = datetime.utcnow().isoformat() + "Z"
            drafts.append(
                DraftArticle(
                    topic_id=topic["id"],
                    title=title,
                    slug=slug,
                    content=content,
                    created_at=created_at,
                )
            )
        return drafts


__all__ = ["ContentAgent", "DraftArticle", "SimpleLocalLLM"]

