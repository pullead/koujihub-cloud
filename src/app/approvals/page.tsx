import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getWorkflowData, targetHref } from "@/lib/workflow-data";
import { approveApprovalAction, markNotificationReadAction, returnApprovalAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ error?: string; approved?: string; returned?: string; read?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const { approvals, auditLogs, notifications } = await getWorkflowData(user.companyId, user.id);

  return (
    <section className="view">
      <PageHeader title="承認ワークフロー・通知" description="注文書、請求書、査定、帳票、日報を共通承認モデルで処理">
        <StatusBadge status={`${approvals.filter((approval) => approval.status === "承認待ち").length}件 承認待ち`} />
      </PageHeader>

      {query.error ? <div className="message error">処理できませんでした。対象データ、DATABASE_URL、Prisma の状態を確認してください。</div> : null}
      {query.approved ? <div className="message success">承認処理が完了しました。</div> : null}
      {query.returned ? <div className="message success">差戻し処理が完了しました。</div> : null}
      {query.read ? <div className="message success">通知を既読にしました。</div> : null}

      <div className="split">
        <section className="panel">
          <h3>承認待ち</h3>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>対象</th>
                  <th>タイトル</th>
                  <th>申請者</th>
                  <th>期限</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td>{approval.target}</td>
                    <td>
                      {targetHref(approval.targetType, approval.targetId) ? (
                        <Link href={targetHref(approval.targetType, approval.targetId) ?? "#"}>
                          <strong>{approval.title}</strong>
                        </Link>
                      ) : (
                        <strong>{approval.title}</strong>
                      )}
                      <br />
                      <span className="muted">{approval.route}</span>
                    </td>
                    <td>{approval.requester}</td>
                    <td>{approval.due}</td>
                    <td>
                      <StatusBadge status={approval.status} />
                    </td>
                    <td>
                      {approval.status === "承認待ち" ? (
                        <div className="filter-row">
                          <form action={approveApprovalAction}>
                            <input name="approvalId" type="hidden" value={approval.id} />
                            <button className="button primary" type="submit">
                              <Icon name="check" />
                              承認
                            </button>
                          </form>
                          <form action={returnApprovalAction}>
                            <input name="approvalId" type="hidden" value={approval.id} />
                            <input name="comment" type="hidden" value="内容を確認してください" />
                            <button className="button danger" type="submit">
                              差戻し
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="muted">処理済</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="panel">
          <h3>通知</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {notifications.map((notification) => (
              <div className="notice" key={notification.id ?? notification.title}>
                <strong>
                  <StatusBadge status={notification.unread ? "未読" : "既読"} /> {notification.title}
                </strong>
                <span>{notification.body}</span>
                {notification.id && notification.unread ? (
                  <form action={markNotificationReadAction} style={{ marginTop: 8 }}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button className="button" type="submit">
                      既読にする
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {!notifications.length ? <div className="empty">通知はありません。</div> : null}
          </div>
        </aside>
      </div>

      <div className="split even">
        <section className="panel">
          <h3>承認ルート</h3>
          <div className="flow" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", marginTop: 14 }}>
            <div className="flow-node">
              <strong>申請</strong>
              <span>対象タイプと targetId を保存</span>
            </div>
            <div className="flow-node">
              <strong>部門承認</strong>
              <span>部門別ルートを適用</span>
            </div>
            <div className="flow-node">
              <strong>総務確認</strong>
              <span>帳票・金額・回収状態を照合</span>
            </div>
            <div className="flow-node">
              <strong>経理確定</strong>
              <span>支払予定へ連携し AuditLog 記録</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>監査ログ</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {auditLogs.map((log) => (
              <div className="audit-item" key={`${log.time}-${log.action}`}>
                <strong>{log.action}</strong>
                <span>
                  {log.time} / {log.user} / {log.target}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
