import Link from "next/link";
import { Icon } from "@/components/icons";
import { Bar, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { notifications } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderList, getProjectList } from "@/lib/db-data";
import { sum, yen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const [projects, orders, invoices] = await Promise.all([getProjectList(user.companyId), getOrderList(user.companyId), getInvoiceList(user.companyId)]);
  const activeProjects = projects.filter((project) => ["施工中", "着工前", "請求中"].includes(project.status));
  const pendingOrders = orders.filter((order) => ["承認待ち", "注文請書待ち"].includes(order.status)).length;
  const pendingInvoices = invoices.filter((invoice) => ["確認中", "保留", "支払予定"].includes(invoice.status)).length;
  const scheduledAmount = sum(
    invoices.filter((invoice) => invoice.status === "支払予定"),
    (invoice) => invoice.amount - invoice.deduction,
  );
  const late = sum(projects, (project) => project.late);
  const missingReports = projects.filter((project) => project.dailyReport === "未提出").length;

  return (
    <section className="view">
      <PageHeader title="月次締め状況と案件横断ビュー" description="2026年04月 / companyId: tokyo-kensetsu / GENERAL_AFFAIRS">
        <Link className="button primary" href="/projects">
          <Icon name="plus" />
          案件登録
        </Link>
        <button className="button" type="button">
          <Icon name="download" />
          月次出力
        </button>
      </PageHeader>

      <div className="grid cols-5">
        <MetricCard label="進行中案件" value={activeProjects.length} detail="施工中・着工前・請求中" tone="blue" icon="building" />
        <MetricCard label="遅延工程" value={late} detail="現場監督へ確認依頼" tone="red" icon="dashboard" />
        <MetricCard label="未承認注文書" value={pendingOrders} detail="注文請書待ちを含む" tone="amber" icon="order" />
        <MetricCard label="未確認請求書" value={pendingInvoices} detail="経理処理前の請求" tone="violet" icon="file" />
        <MetricCard label="今月支払予定" value={yen(scheduledAmount)} detail="承認済・支払予定" icon="yen" />
      </div>

      <div className="split">
        <section className="panel">
          <div className="section-title">
            <div>
              <h3>案件別ステータス</h3>
              <p>工程、帳票、支払、日報の未処理を案件に紐付け</p>
            </div>
            <Link className="icon-button" href="/projects" aria-label="案件一覧">
              <Icon name="arrow" />
            </Link>
          </div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>工事番号</th>
                  <th>案件名</th>
                  <th>部門</th>
                  <th>進捗</th>
                  <th>未完了</th>
                  <th>日報</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.code}</td>
                    <td>
                      <Link href={`/projects/${project.id}`}>
                        <strong>{project.name}</strong>
                      </Link>
                      <br />
                      <span className="muted">{project.site}</span>
                    </td>
                    <td>{project.department}</td>
                    <td>
                      <Progress value={project.progress} tone={project.late ? "amber" : undefined} />
                      <span className="muted">{project.progress}%</span>
                    </td>
                    <td>
                      {project.tasks}件 / 遅延 {project.late}件
                    </td>
                    <td>
                      <StatusBadge status={project.dailyReport} />
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <div>
              <h3>総務アラート</h3>
              <p>注文請書、請求、査定、帳票の回収状況</p>
            </div>
          </div>
          <div className="timeline" style={{ marginTop: 14 }}>
            {notifications.map((notification) => (
              <div className="notice" key={notification.title}>
                <strong>
                  <StatusBadge status={notification.unread ? "未読" : "確認済"} /> {notification.title}
                </strong>
                <span>{notification.body}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>案件中心の業務チェーン</h3>
            <p>Project {"->"} Order {"->"} Invoice {"->"} Assessment {"->"} Payment {"->"} Summary</p>
          </div>
        </div>
        <div className="flow" style={{ marginTop: 14 }}>
          <div className="flow-node">
            <strong>案件 Project</strong>
            <span>{projects.length}件 / 部門・現場・施主を管理</span>
          </div>
          <div className="flow-node">
            <strong>注文 Order</strong>
            <span>{orders.length}件 / 注文請書回収率 64%</span>
          </div>
          <div className="flow-node">
            <strong>請求 Invoice</strong>
            <span>{invoices.length}件 / 未確認 {pendingInvoices}件</span>
          </div>
          <div className="flow-node">
            <strong>査定 Assessment</strong>
            <span>5件 / 差戻し 1件</span>
          </div>
          <div className="flow-node">
            <strong>支払 Payment</strong>
            <span>予定 {yen(scheduledAmount)} / 支払済 1件</span>
          </div>
          <div className="flow-node">
            <strong>支払状況表</strong>
            <span>支払先別・部門別に月次集計</span>
          </div>
        </div>
      </section>

      <div className="grid cols-3">
        <section className="panel">
          <h3>部門別未確認</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            <Bar label="建築" value={82} tone="amber" valueLabel="12件" />
            <Bar label="土木" value={36} tone="blue" valueLabel="5件" />
            <Bar label="資材" value={54} valueLabel="8件" />
            <Bar label="リサイクル" value={28} tone="red" valueLabel="4件" />
          </div>
        </section>
        <section className="panel">
          <h3>帳票不足案件</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {projects.map((project) => (
              <Bar key={project.id} label={project.department} value={Math.min(100, project.docsMissing * 12)} tone={project.docsMissing > 5 ? "red" : "amber"} valueLabel={`${project.docsMissing}件`} />
            ))}
          </div>
        </section>
        <section className="panel">
          <h3>現場入力</h3>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>今日の日報未提出</span>
              <strong>{missingReports}件</strong>
            </div>
            <div className="kv">
              <span>新着写真</span>
              <strong>38枚</strong>
            </div>
            <div className="kv">
              <span>新着図面</span>
              <strong>7件</strong>
            </div>
            <div className="kv">
              <span>是正確認待ち</span>
              <strong>5件</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
