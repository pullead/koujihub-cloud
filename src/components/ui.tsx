import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function Badge({ children, tone = "dark" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function statusTone(status: string) {
  if (["施工中", "取引中", "注文請書回収済", "支払済", "経理確認済", "保管済", "承認済", "完了", "提出済", "部門確認済", "総務確認済"].includes(status)) return "green";
  if (["着工前", "確認中", "作成中", "下書き", "入力中", "予定", "送付済"].includes(status)) return "blue";
  if (["承認待ち", "注文請書待ち", "請求中", "支払予定", "未入力", "新規申請中", "30日以内更新"].includes(status)) return "amber";
  if (["差戻し", "保留", "要確認", "未提出", "期限切れ", "遅延注意"].includes(status)) return "red";
  return "dark";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function MetricCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
  icon: IconName;
}) {
  return (
    <article className={`metric-card ${tone ?? ""}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon name={icon} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function Progress({ value, tone }: { value: number; tone?: string }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={`progress ${tone ?? ""}`}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

export function Bar({ label, value, tone, valueLabel }: { label: string; value: number; tone?: string; valueLabel: string }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className={`bar ${tone ?? ""}`}>
        <span style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
      <strong>{valueLabel}</strong>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="view-header">
      <div className="view-title">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children ? <div className="filter-row">{children}</div> : null}
    </div>
  );
}
