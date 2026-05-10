import { StatusBadge } from "@/components/ui";
import type { TargetWorkflowHistory } from "@/lib/types";

export function WorkflowHistoryPanel({ history }: { history: TargetWorkflowHistory }) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h3>承認・履歴</h3>
          <p>この対象に対する申請、承認、差戻し、監査ログを時系列で確認します。</p>
        </div>
        <StatusBadge status={history.currentStatus} />
      </div>

      <div className="split even" style={{ marginTop: 14 }}>
        <div>
          <h3>承認履歴</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {history.approvals.map((approval) => (
              <div className="notice" key={approval.id}>
                <strong>
                  <StatusBadge status={approval.status} /> {approval.title}
                </strong>
                <span>
                  {approval.requester} / {approval.route} / {approval.due}
                </span>
                {approval.steps.map((step) => (
                  <span key={step.id}>
                    Step {step.order}: {step.role} / {step.status}
                    {step.actedAt ? ` / ${step.actedAt}` : ""}
                    {step.comment ? ` / ${step.comment}` : ""}
                  </span>
                ))}
              </div>
            ))}
            {!history.approvals.length ? <div className="empty">承認申請はまだありません。</div> : null}
          </div>
        </div>

        <div>
          <h3>監査ログ</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {history.auditLogs.map((log) => (
              <div className="audit-item" key={log.id ?? `${log.time}-${log.action}`}>
                <strong>{log.action}</strong>
                <span>
                  {log.time} / {log.user} / {log.target}
                </span>
              </div>
            ))}
            {!history.auditLogs.length ? <div className="empty">監査ログはまだありません。</div> : null}
          </div>
        </div>
      </div>

      {history.notifications.length ? (
        <div className="timeline" style={{ marginTop: 14 }}>
          {history.notifications.map((notification) => (
            <div className="notice" key={notification.id ?? notification.title}>
              <strong>
                <StatusBadge status={notification.unread ? "未読" : "既読"} /> {notification.title}
              </strong>
              <span>{notification.body}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
