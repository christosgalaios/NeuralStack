import { CATEGORY_META } from "@/lib/config";

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: "rgba(13,106,122,0.10)", text: "#2da0b0", border: "rgba(13,106,122,0.25)" },
  purple: { bg: "rgba(122,132,148,0.10)", text: "#9aa4b4", border: "rgba(122,132,148,0.25)" },
  green:  { bg: "rgba(34,197,94,0.10)", text: "#4ade80", border: "rgba(34,197,94,0.25)" },
  amber:  { bg: "rgba(200,150,74,0.10)", text: "#ddb068", border: "rgba(200,150,74,0.25)" },
  red:    { bg: "rgba(192,88,88,0.10)", text: "#d47878", border: "rgba(192,88,88,0.25)" },
  slate:  { bg: "rgba(26,138,154,0.10)", text: "#4cc0d0", border: "rgba(26,138,154,0.25)" },
};

export default function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.guide;
  const colors = BADGE_COLORS[meta.color] || BADGE_COLORS.slate;

  return (
    <span
      className="inline-block w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {meta.display}
    </span>
  );
}
