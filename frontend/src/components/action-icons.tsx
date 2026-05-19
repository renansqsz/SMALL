import type { PropsWithChildren } from "react";

type IconProps = {
  className?: string;
};

function IconShell({ children, className }: PropsWithChildren<IconProps>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5z" />
      <path d="M13 6 18 11" />
    </IconShell>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M5 7.5h14" />
      <path d="M9 7.5V5.8A1.3 1.3 0 0 1 10.3 4.5h3.4A1.3 1.3 0 0 1 15 5.8v1.7" />
      <path d="M8.5 7.5 9.2 19h5.6l.7-11.5" />
      <path d="M11 10.5v5" />
      <path d="M13 10.5v5" />
    </IconShell>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="3.2" />
    </IconShell>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <IconShell className={className}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.1-5.2" />
      <path d="M4.5 4.5v3.8h3.8" />
      <path d="M12 7.2v5l3.5 2.2" />
    </IconShell>
  );
}
