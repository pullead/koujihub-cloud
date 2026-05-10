import Link from "next/link";
import { Icon } from "@/components/icons";
import { MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { getSystemStatus } from "@/lib/system-status";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const status = await getSystemStatus();

  return (
    <section className="view">
      <PageHeader title="システム状態" description="PostgreSQL 接続、Prisma テーブル件数、最近の監査ログを確認">
        <StatusBadge status={status.database.ok ? "接続済" : "未接続"} />
        <Link className="button" href="/admin">
          管理設定へ戻る
        </Link>
      </PageHeader>

      {!status.database.ok ? (
        <div className="message error">
          PostgreSQL に接続できません。`docker compose up -d postgres` または本機 PostgreSQL を起動し、`npm run db:push` と `npm run db:seed` を実行してください。
        </div>
      ) : (
        <div className="message success">PostgreSQL に接続できています。Prisma の読み書き検証を進められます。</div>
      )}

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>Database</h3>
            <p>現在の DATABASE_URL と疎通状態</p>
          </div>
          <StatusBadge status={status.database.ok ? "OK" : "ERROR"} />
        </div>
        <div className="key-values" style={{ marginTop: 14 }}>
          <div className="kv">
            <span>接続先</span>
            <strong>{status.database.url}</strong>
          </div>
          <div className="kv">
            <span>応答時間</span>
            <strong>{status.database.latencyMs == null ? "-" : `${status.database.latencyMs}ms`}</strong>
          </div>
          <div className="kv" style={{ gridColumn: "1 / -1" }}>
            <span>エラー</span>
            <strong>{status.database.error ?? "-"}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>テーブル件数</h3>
            <p>Seed 後に各マスタと業務データが入っているかを確認します。</p>
          </div>
          <Icon name="ledger" />
        </div>
        {status.counts.length ? (
          <div className="grid cols-5" style={{ marginTop: 14 }}>
            {status.counts.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} detail="Prisma count" icon="database" />
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>
            データベース未接続のため、件数を取得できません。
          </div>
        )}
      </section>

      <section className="panel">
        <h3>最近の AuditLog</h3>
        {status.auditLogs.length ? (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>操作</th>
                  <th>対象</th>
                  <th>ユーザー</th>
                </tr>
              </thead>
              <tbody>
                {status.auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.createdAt}</td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td>{log.target}</td>
                    <td>{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>
            監査ログはまだありません。
          </div>
        )}
      </section>
    </section>
  );
}
