import Link from "next/link";
import { Icon } from "@/components/icons";
import { Bar, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { paymentAssessments } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderList, getProjectList } from "@/lib/db-data";

export const dynamic = "force-dynamic";

export default async function OfficeDashboardPage() {
  const user = await requireAuth();
  const [projects, orders, invoices] = await Promise.all([getProjectList(user.companyId), getOrderList(user.companyId), getInvoiceList(user.companyId)]);
  const pendingConfirmations = orders.filter((order) => order.status === "注文請書待ち").length;
  const unconfirmedInvoices = invoices.filter((invoice) => ["確認中", "保留"].includes(invoice.status)).length;
  const unfinishedAssessments = paymentAssessments.filter((assessment) => ["未入力", "入力中", "差戻し"].includes(assessment.status)).length;

  return (
    <section className="view">
      <PageHeader title="総務ダッシュボード" description="月次締め、注文請書回収、査定入力、支払予定を横断管理">
        <select className="control">
          <option>2026年04月</option>
          <option>2026年03月</option>
        </select>
        <button className="button primary" type="button">
          <Icon name="check" />
          締めチェック
        </button>
      </PageHeader>

      <div className="grid cols-4">
        <MetricCard label="未回収注文請書" value={pendingConfirmations} detail="業者へ催促対象" tone="amber" icon="order" />
        <MetricCard label="請求書未確認" value={unconfirmedInvoices} detail="インボイス・金額確認" tone="red" icon="file" />
        <MetricCard label="査定入力未完了" value={unfinishedAssessments} detail="現場・部門確認待ち" tone="violet" icon="calculator" />
        <MetricCard label="支払保留" value={invoices.filter((invoice) => invoice.status === "保留").length} detail="差戻し・安全書類" tone="red" icon="yen" />
      </div>

      <div className="split">
        <section className="panel">
          <div className="section-title">
            <div>
              <h3>総務主流程</h3>
              <p>案件登録から月次締めまでの現在位置</p>
            </div>
          </div>
          <div className="flow" style={{ marginTop: 14 }}>
            {["案件登録", "業者登録", "注文書作成", "注文請書回収", "査定入力", "支払予定"].map((label, index) => (
              <div className="flow-node" key={label}>
                <strong>{label}</strong>
                <span>{index < 3 ? "完了率 90%以上" : index === 3 ? "未回収あり" : "確認待ちあり"}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h3>部門別未処理</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            <Bar label="建築" value={86} tone="amber" valueLabel="18件" />
            <Bar label="土木" value={38} tone="blue" valueLabel="7件" />
            <Bar label="資材" value={44} valueLabel="9件" />
            <Bar label="総務" value={21} valueLabel="4件" />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>未回収・未確認一覧</h3>
            <p>総務担当が毎朝確認する作業キュー</p>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>区分</th>
                <th>対象</th>
                <th>案件</th>
                <th>期限</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((order) => order.status === "注文請書待ち")
                .map((order) => (
                  <tr key={order.id}>
                    <td>注文請書</td>
                    <td>{order.number}</td>
                    <td>{projects.find((project) => project.id === order.projectId)?.name}</td>
                    <td>2026-04-24</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <button className="button" type="button">
                        <Icon name="bell" />
                        催促
                      </button>
                    </td>
                  </tr>
                ))}
              {invoices
                .filter((invoice) => invoice.status !== "支払済")
                .map((invoice) => (
                  <tr key={invoice.id}>
                    <td>請求書</td>
                    <td>{invoice.number}</td>
                    <td>{projects.find((project) => project.id === invoice.projectId)?.name}</td>
                    <td>{invoice.due}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td>
                      <Link className="button" href="/office/invoices">
                        <Icon name="arrow" />
                        確認
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
