import Link from "next/link";
import { Icon } from "@/components/icons";
import { MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { paymentAssessments } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderList, getProjectList, getVendorList } from "@/lib/db-data";
import { sum, yen } from "@/lib/format";
import { createInvoiceAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [invoices, orders, projects, vendors] = await Promise.all([getInvoiceList(user.companyId), getOrderList(user.companyId), getProjectList(user.companyId), getVendorList(user.companyId)]);
  const projectName = (projectId: string) => projects.find((project) => project.id === projectId)?.name ?? "-";
  const vendorName = (vendorId: string) => vendors.find((vendor) => vendor.id === vendorId)?.name ?? "-";
  const orderNumber = (orderId: string) => orders.find((order) => order.id === orderId)?.number ?? "-";
  const scheduled = invoices.filter((invoice) => invoice.status === "支払予定");
  const paid = invoices.filter((invoice) => invoice.status === "支払済");

  return (
    <section className="view">
      <PageHeader title="請求・支払管理" description="請求書受領、インボイス確認、査定差異、支払予定、支払済を管理">
        <select className="control">
          <option>2026年04月</option>
          <option>2026年05月</option>
        </select>
        <a className="button primary" href="#new-invoice">
          <Icon name="plus" />
          請求書登録
        </a>
        <button className="button" type="button">
          <Icon name="download" />
          Excel
        </button>
      </PageHeader>

      {query.error ? <div className="message error">保存できませんでした。注文書の選択、請求番号の重複、DATABASE_URL を確認してください。</div> : null}
      {query.created ? <div className="message success">請求書を登録しました。</div> : null}

      <section className="panel" id="new-invoice">
        <div className="section-title">
          <div>
            <h3>請求書登録</h3>
            <p>注文書を選択すると、Server Action 側で案件・業者に紐付けて請求データを保存します。</p>
          </div>
        </div>
        <form action={createInvoiceAction} className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-field">
            <label htmlFor="invoiceNumber">請求番号</label>
            <input id="invoiceNumber" name="invoiceNumber" required placeholder="INV-2026-220" />
          </div>
          <div className="form-field wide">
            <label htmlFor="orderId">注文書</label>
            <select id="orderId" name="orderId" required defaultValue={orders[0]?.id ?? ""}>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.number} / {projectName(order.projectId)} / {vendorName(order.vendorId)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="invoiceDate">請求日</label>
            <input id="invoiceDate" name="invoiceDate" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="receivedDate">受領日</label>
            <input id="receivedDate" name="receivedDate" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="paymentDueDate">支払予定日</label>
            <input id="paymentDueDate" name="paymentDueDate" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="amountExTax">税抜請求額</label>
            <input id="amountExTax" name="amountExTax" type="number" min="0" required placeholder="4800000" />
          </div>
          <div className="form-field">
            <label htmlFor="taxAmount">消費税</label>
            <input id="taxAmount" name="taxAmount" type="number" min="0" required placeholder="480000" />
          </div>
          <div className="form-field">
            <label htmlFor="withholdingAmount">源泉・控除</label>
            <input id="withholdingAmount" name="withholdingAmount" type="number" min="0" defaultValue="0" />
          </div>
          <div className="form-field">
            <label htmlFor="offsetAmount">相殺額</label>
            <input id="offsetAmount" name="offsetAmount" type="number" min="0" defaultValue="0" />
          </div>
          <div className="form-field">
            <label htmlFor="status">状態</label>
            <select id="status" name="status" defaultValue="checking">
              <option value="checking">確認中</option>
              <option value="pending_approval">承認待ち</option>
              <option value="approved">承認済</option>
              <option value="scheduled">支払予定</option>
              <option value="paid">支払済</option>
              <option value="on_hold">保留</option>
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="invoiceRegistrationNumber">適格請求書番号</label>
            <input id="invoiceRegistrationNumber" name="invoiceRegistrationNumber" placeholder="T1234567890123" />
          </div>
          <div className="form-field full">
            <button className="button primary" type="submit">
              <Icon name="plus" />
              Prisma に請求書を保存
            </button>
          </div>
        </form>
      </section>

      <div className="grid cols-4">
        <MetricCard label="支払予定" value={yen(sum(scheduled, (invoice) => invoice.amount - invoice.deduction))} detail={`${scheduled.length}件`} tone="amber" icon="yen" />
        <MetricCard label="支払済" value={yen(sum(paid, (invoice) => invoice.amount - invoice.deduction))} detail={`${paid.length}件`} icon="check" />
        <MetricCard label="確認中" value={invoices.filter((invoice) => invoice.status === "確認中").length} detail="現場・総務確認" tone="blue" icon="file" />
        <MetricCard label="保留" value={invoices.filter((invoice) => invoice.status === "保留").length} detail="差戻し・安全書類" tone="red" icon="bell" />
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>請求番号</th>
                <th>案件</th>
                <th>業者</th>
                <th>注文番号</th>
                <th>請求日</th>
                <th>支払予定日</th>
                <th>請求額</th>
                <th>控除</th>
                <th>実支払</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/office/invoices/${invoice.id}`}>
                      <strong>{invoice.number}</strong>
                    </Link>
                  </td>
                  <td>{projectName(invoice.projectId)}</td>
                  <td>{vendorName(invoice.vendorId)}</td>
                  <td>{orderNumber(invoice.orderId)}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.due}</td>
                  <td>{yen(invoice.amount)}</td>
                  <td>{yen(invoice.deduction)}</td>
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

      <div className="split even">
        <section className="panel">
          <h3>査定差異チェック</h3>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>注文</th>
                  <th>請求</th>
                  <th>査定</th>
                  <th>差異</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {paymentAssessments.slice(0, 4).map((assessment) => {
                  const linkedInvoice = invoices.find((invoice) => invoice.orderId === assessment.orderId);
                  const diff = (linkedInvoice?.amount ?? assessment.progressAmount) - assessment.assessed;
                  return (
                    <tr key={assessment.id}>
                      <td>{orderNumber(assessment.orderId)}</td>
                      <td>{yen(linkedInvoice?.amount ?? assessment.progressAmount)}</td>
                      <td>{yen(assessment.assessed)}</td>
                      <td>{yen(diff)}</td>
                      <td>
                        <StatusBadge status={assessment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>経理処理キュー</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            {scheduled.map((invoice) => (
              <div className="notice" key={invoice.id}>
                <strong>
                  {invoice.number} / {vendorName(invoice.vendorId)}
                </strong>
                <span>
                  {projectName(invoice.projectId)} / 支払予定日 {invoice.due} / {yen(invoice.amount - invoice.deduction)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
