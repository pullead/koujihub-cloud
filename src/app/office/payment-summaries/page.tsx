import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { paymentAssessments } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderList, getProjectList, getVendorList } from "@/lib/db-data";
import { sum, yen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentSummariesPage() {
  const user = await requireAuth();
  const [invoices, orders, projects, vendors] = await Promise.all([getInvoiceList(user.companyId), getOrderList(user.companyId), getProjectList(user.companyId), getVendorList(user.companyId)]);
  const projectName = (projectId: string) => projects.find((project) => project.id === projectId)?.name ?? "-";
  const orderNumber = (orderId: string) => orders.find((order) => order.id === orderId)?.number ?? "-";
  const summaries = vendors
    .map((vendor) => {
      const relatedInvoices = invoices.filter((invoice) => invoice.vendorId === vendor.id);
      const relatedAssessments = paymentAssessments.filter((assessment) => assessment.vendorId === vendor.id);
      const invoiceAmount = sum(relatedInvoices, (invoice) => invoice.amount);
      const deductions = sum(relatedInvoices, (invoice) => invoice.deduction);
      const paid = sum(
        relatedInvoices.filter((invoice) => invoice.status === "支払済"),
        (invoice) => invoice.amount - invoice.deduction,
      );
      return {
        vendor,
        projects: new Set(relatedInvoices.map((invoice) => invoice.projectId)).size || vendor.projects,
        count: relatedInvoices.length,
        invoiceAmount,
        deductions,
        scheduled: sum(relatedAssessments, (assessment) => assessment.assessed - assessment.deduction),
        paid,
      };
    })
    .filter((summary) => summary.count || summary.scheduled);

  const selected = summaries[0];

  return (
    <section className="view">
      <PageHeader title="支払先別支払状況表" description="支払先単位で複数案件・複数注文・複数請求を月次集計">
        <select className="control">
          <option>2026年04月</option>
          <option>2026年05月</option>
        </select>
        <button className="button" type="button">
          <Icon name="download" />
          Excel
        </button>
        <button className="button primary" type="button">
          <Icon name="check" />
          月次締め
        </button>
      </PageHeader>

      <div className="split">
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>支払先</th>
                  <th>案件数</th>
                  <th>請求件数</th>
                  <th>税込合計</th>
                  <th>控除</th>
                  <th>支払予定</th>
                  <th>未払</th>
                  <th>確認</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr key={summary.vendor.id}>
                    <td>
                      <strong>{summary.vendor.name}</strong>
                      <br />
                      <span className="muted">{summary.vendor.bank}</span>
                    </td>
                    <td>{summary.projects}</td>
                    <td>{summary.count}</td>
                    <td>{yen(summary.invoiceAmount)}</td>
                    <td>{yen(summary.deductions)}</td>
                    <td>{yen(summary.scheduled)}</td>
                    <td>{yen(Math.max(0, summary.scheduled - summary.paid))}</td>
                    <td>
                      <StatusBadge status={summary.vendor.status === "要確認" ? "要確認" : "総務確認済"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {selected ? (
          <aside className="panel">
            <div className="section-title">
              <div>
                <h3>{selected.vendor.name}</h3>
                <p>{selected.vendor.bank}</p>
              </div>
              <StatusBadge status={selected.vendor.status} />
            </div>
            <div className="key-values" style={{ marginTop: 14 }}>
              <div className="kv">
                <span>税込合計</span>
                <strong>{yen(selected.invoiceAmount)}</strong>
              </div>
              <div className="kv">
                <span>支払予定</span>
                <strong>{yen(selected.scheduled)}</strong>
              </div>
              <div className="kv">
                <span>支払済</span>
                <strong>{yen(selected.paid)}</strong>
              </div>
              <div className="kv">
                <span>未払</span>
                <strong>{yen(Math.max(0, selected.scheduled - selected.paid))}</strong>
              </div>
            </div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>案件</th>
                    <th>注文</th>
                    <th>請求</th>
                    <th>状態</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter((invoice) => invoice.vendorId === selected.vendor.id)
                    .map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{projectName(invoice.projectId)}</td>
                        <td>{orderNumber(invoice.orderId)}</td>
                        <td>{yen(invoice.amount)}</td>
                        <td>
                          <StatusBadge status={invoice.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </aside>
        ) : (
          <aside className="panel">
            <div className="empty">支払状況の対象データがまだありません。</div>
          </aside>
        )}
      </div>
    </section>
  );
}
