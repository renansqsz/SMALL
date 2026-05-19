type StatusPillProps = {
  tone?: "info" | "success" | "warning";
  value: string;
};

export function StatusPill({ tone = "info", value }: StatusPillProps) {
  return <span className={`pill ${tone}`}>{value}</span>;
}
