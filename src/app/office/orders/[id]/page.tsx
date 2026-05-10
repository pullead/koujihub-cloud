import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { WorkflowHistoryPanel } from "@/components/workflow-history";
import { requestApprovalAction } from "@/app/approvals/actions";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderById, getProjectList, getVendorList } from "@/lib/db-data";
import { yen } from "@/lib/format";
import { getTargetWorkflowHistory } from "@/lib/workflow-data";
import { updateOrderStatusAction } from "../actions";

const orderStatusOptions = [
  ["draft", "作成中"],
  ["pending_approval", "承認待ち"],
  ["approved", "承認済"],
  ["sent", "送付済"],
  ["waiting_confirmation", "注文請書待ち"],
  ["confirmation_received", "注文請書回収済"],
] as const;

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; updated?: string; approval?: string; duplicate?: string }> }) {
  const { id } = await params;
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [order, projects, vendors, invoices, history] = await Promise.all([getOrderById(user.companyId, id), getProjectList(user.companyId), getVendorList(user.companyId), getInvoiceList(user.companyId), getTargetWorkflowHistory(user.companyId, "Order", id)]);

  if (!order) {
    notFound();
  }

  const project = projects.find((candidate) => candidate.id === order.projectId);
  const vendor = vendors.find((candidate) => candidate.id === order.vendorId);
  const linkedInvoices = invoices.filter((invoice) => invoice.orderId === order.id);
  const amountWithTax = order.amount + order.tax;

  return (
    <section className="view">
      <PageHeader title={order.number} description={`${order.title} / ${project?.name ?? "-"} / ${vendor?.name ?? "-"}`}>
        <StatusBadge status={order.status} />
        <Link className="button" href="/office/orders">
          一覧へ戻る
        </Link>
      </PageHeader>

      {query.error ? <div className="message error">状態を更新できませんでした。DATABASE_URL と対象データを確認してください。</div> : null}
      {query.updated ? <div className="message success">注文書の状態を更新しました。</div> : null}
      {query.approval ? <div className="message success">注文書の承認申請を作成しました。</div> : null}
      {query.duplicate ? <div className="message">承認待ちの申請がすでにあります。</div> : null}

      <div className="grid cols-4">
        <MetricCard label="税抜注文額" value={yen(order.amount)} detail={order.trade} icon="order" />
        <MetricCard label="消費税" value={yen(order.tax)} detail="注文書税額" tone="blue" icon="yen" />
        <MetricCard label="税込注文額" value={yen(amountWithTax)} detail={order.date} tone="amber" icon="yen" />
        <MetricCard label="関連請求" value={`${linkedInvoices.length}件`} detail={linkedInvoices[0]?.status ?? "未登録"} icon="file" />
      </div>

      <div className="split even">
        <section className="panel">
          <div className="section-title">
            <div>
              <h3>注文書概要</h3>
              <p>案件、業者、工期、承認状況を注文番号単位で確認します。</p>
            </div>
          </div>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>案件</span>
              <strong>{project?.name ?? "-"}</strong>
            </div>
            <div className="kv">
              <span>業者</span>
              <strong>{vendor?.name ?? "-"}</strong>
            </div>
            <div className="kv">
              <span>工期</span>
              <strong>{order.period}</strong>
            </div>
            <div className="kv">
              <span>承認者</span>
              <strong>{order.approver}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <div>
              <h3>状態更新</h3>
              <p>更新時に Prisma で注文書と履歴ログを保存します。</p>
            </div>
          </div>
          <form action={updateOrderStatusAction} className="form-grid" style={{ marginTop: 14 }}>
            <input name="orderId" type="hidden" value={order.id} />
            <div className="form-field wide">
              <label htmlFor="status">次の状態</label>
              <select id="status" name="status" defaultValue="pending_approval">
                {orderStatusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field full">
              <button className="button primary" type="submit">
                <Icon name="check" />
                状態を保存
              </button>
            </div>
          </form>
          {history.hasPendingApproval ? (
            <div className="message" style={{ marginTop: 14 }}>承認待ちの申請があります。</div>
          ) : (
            <form action={requestApprovalAction} className="form-grid" style={{ marginTop: 14 }}>
              <input name="targetType" type="hidden" value="Order" />
              <input name="targetId" type="hidden" value={order.id} />
              <input name="title" type="hidden" value={`${order.number} ${order.title}`} />
              <input name="sourcePath" type="hidden" value={`/office/orders/${order.id}`} />
              <div className="form-field full">
                <button className="button" type="submit">
                  <Icon name="check" />
                  承認申請を作成
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <section className="panel">
        <h3>関連請求書</h3>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>請求番号</th>
                <th>請求日</th>
                <th>支払予定日</th>
                <th>請求額</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {linkedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/office/invoices/${invoice.id}`}>
                      <strong>{invoice.number}</strong>
                    </Link>
                  </td>
                  <td>{invoice.date}</td>
                  <td>{invoice.due}</td>
                  <td>{yen(invoice.amount - invoice.deduction)}</td>
                  <td>
                    <StatusBadge status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WorkflowHistoryPanel history={history} />
    </section>
  );
}
