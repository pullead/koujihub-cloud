import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { WorkflowHistoryPanel } from "@/components/workflow-history";
import { requestApprovalAction } from "@/app/approvals/actions";
import { requireAuth } from "@/lib/auth";
import { getInvoiceById, getOrderList, getProjectList, getVendorList } from "@/lib/db-data";
import { yen } from "@/lib/format";
import { getTargetWorkflowHistory } from "@/lib/workflow-data";
import { updateInvoiceStatusAction } from "../actions";

const invoiceStatusOptions = [
  ["checking", "確認中"],
  ["pending_approval", "承認待ち"],
  ["approved", "承認済"],
  ["scheduled", "支払予定"],
  ["paid", "支払済"],
  ["on_hold", "保留"],
] as const;

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; updated?: string; approval?: string; duplicate?: string }> }) {
  const { id } = await params;
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [invoice, orders, projects, vendors, history] = await Promise.all([getInvoiceById(user.companyId, id), getOrderList(user.companyId), getProjectList(user.companyId), getVendorList(user.companyId), getTargetWorkflowHistory(user.companyId, "Invoice", id)]);

  if (!invoice) {
    notFound();
  }

  const order = orders.find((candidate) => candidate.id === invoice.orderId);
  const project = projects.find((candidate) => candidate.id === invoice.projectId);
  const vendor = vendors.find((candidate) => candidate.id === invoice.vendorId);
  const payable = invoice.amount - invoice.deduction;

  return (
    <section className="view">
      <PageHeader title={invoice.number} description={`${project?.name ?? "-"} / ${vendor?.name ?? "-"} / 注文 ${order?.number ?? "-"}`}>
        <StatusBadge status={invoice.status} />
        <Link className="button" href="/office/invoices">
          一覧へ戻る
        </Link>
      </PageHeader>

      {query.error ? <div className="message error">状態を更新できませんでした。DATABASE_URL と対象データを確認してください。</div> : null}
      {query.updated ? <div className="message success">請求書の状態を更新しました。</div> : null}
      {query.approval ? <div className="message success">請求書の承認申請を作成しました。</div> : null}
      {query.duplicate ? <div className="message">承認待ちの申請がすでにあります。</div> : null}

      <div className="grid cols-4">
        <MetricCard label="請求額" value={yen(invoice.amount)} detail={invoice.date} icon="file" />
        <MetricCard label="控除・相殺" value={yen(invoice.deduction)} detail="源泉・相殺合計" tone="red" icon="yen" />
        <MetricCard label="実支払額" value={yen(payable)} detail={invoice.due} tone="amber" icon="yen" />
        <MetricCard label="確認者" value={invoice.checkedBy} detail="現場・総務・経理" tone="blue" icon="check" />
      </div>

      <div className="split even">
        <section className="panel">
          <div className="section-title">
            <div>
              <h3>請求書概要</h3>
              <p>注文、案件、業者、支払予定を請求番号単位で確認します。</p>
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
              <span>注文番号</span>
              <strong>{order?.number ?? "-"}</strong>
            </div>
            <div className="kv">
              <span>支払予定日</span>
              <strong>{invoice.due}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <div>
              <h3>状態更新</h3>
              <p>確認、承認、支払予定、支払済までの状態を Prisma に保存します。</p>
            </div>
          </div>
          <form action={updateInvoiceStatusAction} className="form-grid" style={{ marginTop: 14 }}>
            <input name="invoiceId" type="hidden" value={invoice.id} />
            <div className="form-field wide">
              <label htmlFor="status">次の状態</label>
              <select id="status" name="status" defaultValue="approved">
                {invoiceStatusOptions.map(([value, label]) => (
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
              <input name="targetType" type="hidden" value="Invoice" />
              <input name="targetId" type="hidden" value={invoice.id} />
              <input name="title" type="hidden" value={`${invoice.number} ${vendor?.name ?? ""}`} />
              <input name="sourcePath" type="hidden" value={`/office/invoices/${invoice.id}`} />
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
        <h3>注文照合</h3>
        <div className="key-values" style={{ marginTop: 14 }}>
          <div className="kv">
            <span>注文額</span>
            <strong>{order ? yen(order.amount + order.tax) : "-"}</strong>
          </div>
          <div className="kv">
            <span>請求額</span>
            <strong>{yen(invoice.amount)}</strong>
          </div>
          <div className="kv">
            <span>差異</span>
            <strong>{order ? yen(invoice.amount - order.amount - order.tax) : "-"}</strong>
          </div>
          <div className="kv">
            <span>注文状態</span>
            <strong>{order?.status ?? "-"}</strong>
          </div>
        </div>
      </section>

      <WorkflowHistoryPanel history={history} />
    </section>
  );
}
