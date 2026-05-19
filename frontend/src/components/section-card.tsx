import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  copy?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function SectionCard({ actions, children, className, copy, title }: SectionCardProps) {
  return (
    <section className={`surface-panel${className ? ` ${className}` : ""}`}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {copy ? <p className="panel-copy">{copy}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
