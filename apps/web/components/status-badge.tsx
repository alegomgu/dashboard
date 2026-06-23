type StatusBadgeProps = {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

const toneClass: Record<StatusBadgeProps["tone"], string> = {
  neutral: "border-line bg-panelSoft text-ink",
  success: "border-positive/25 bg-positive/10 text-positive",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-lg border px-3 text-[11px] font-bold uppercase ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}
