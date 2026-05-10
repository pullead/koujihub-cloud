import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getOrderList, getProjectList, getVendorList } from "@/lib/db-data";
import { yen } from "@/lib/format";
import { createOrderAction } from "./actions";

const statuses = ["作成中", "承認待ち", "送付済", "注文請書待ち", "注文請書回収済"];

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [orders, projects, vendors] = await Promise.all([getOrderList(user.companyId), getProjectList(user.companyId), getVendorList(user.companyId)]);
  const projectName = (projectId: string) => projects.find((project) => project.id === projectId)?.name ?? "-";
  const vendorName = (vendorId: string) => vendors.find((vendor) => vendor.id === vendorId)?.name ?? "-";

  return (
    <section className="view">
      <PageHeader title="注文書・注文請書管理" description="発注、承認、送付、注文請書回収、請求連動までを状態管理">
        <a className="button primary" href="#new-order">
          <Icon name="plus" />
          注文書作成
        </a>
        <button className="button" type="button">
          <Icon name="download" />
          Excel
        </button>
      </PageHeader>

      {query.error ? <div className="message error">保存できませんでした。案件・業者の選択、注文番号の重複、DATABASE_URL を確認してください。</div> : null}
      {query.created ? <div className="message success">注文書を作成しました。</div> : null}

      <section className="panel" id="new-order">
        <div className="section-title">
          <div>
            <h3>注文書作成</h3>
            <p>案件と業者を選択すると、Server Action 側で案件の部門に紐付けて保存します。</p>
          </div>
        </div>
        <form action={createOrderAction} className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-field">
            <label htmlFor="orderNumber">注文番号</label>
            <input id="orderNumber" name="orderNumber" required placeholder="PO-2026-150" />
          </div>
          <div className="form-field wide">
            <label htmlFor="projectId">案件</label>
            <select id="projectId" name="projectId" required defaultValue={projects[0]?.id ?? ""}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} / {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="vendorId">業者</label>
            <select id="vendorId" name="vendorId" required defaultValue={vendors[0]?.id ?? ""}>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.code} / {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tradeType">工種</label>
            <input id="tradeType" name="tradeType" required placeholder="空調設備" />
          </div>
          <div className="form-field wide">
            <label htmlFor="orderTitle">件名</label>
            <input id="orderTitle" name="orderTitle" required placeholder="空調機更新・配管工事" />
          </div>
          <div className="form-field">
            <label htmlFor="orderAmountExTax">税抜金額</label>
            <input id="orderAmountExTax" name="orderAmountExTax" type="number" min="0" required placeholder="12000000" />
          </div>
          <div className="form-field">
            <label htmlFor="taxRate">税率 %</label>
            <input id="taxRate" name="taxRate" type="number" min="0" max="100" defaultValue="10" />
          </div>
          <div className="form-field">
            <label htmlFor="status">状態</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">作成中</option>
              <option value="pending_approval">承認待ち</option>
              <option value="approved">承認済</option>
              <option value="sent">送付済</option>
              <option value="waiting_confirmation">注文請書待ち</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="orderDate">注文日</label>
            <input id="orderDate" name="orderDate" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="startDate">工期開始</label>
            <input id="startDate" name="startDate" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="endDate">工期終了</label>
            <input id="endDate" name="endDate" type="date" />
          </div>
          <div className="form-field wide">
            <label htmlFor="paymentTerms">支払条件</label>
            <input id="paymentTerms" name="paymentTerms" placeholder="月末締め翌月末支払" />
          </div>
          <div className="form-field full">
            <button className="button primary" type="submit">
              <Icon name="plus" />
              Prisma に注文書を保存
            </button>
          </div>
        </form>
      </section>

      <div className="kanban">
        {statuses.map((status) => (
          <div className="kanban-column" key={status}>
            <h4>{status}</h4>
            {orders
              .filter((order) => order.status === status)
              .map((order) => (
                <div className="kanban-card" key={order.id}>
                  <strong>{order.number}</strong>
                  <span>{order.title}</span>
                  <span className="muted">
                    {vendorName(order.vendorId)} / {yen(order.amount + order.tax)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
              ))}
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>注文番号</th>
                <th>案件</th>
                <th>業者</th>
                <th>工種</th>
                <th>注文金額</th>
                <th>工期</th>
                <th>承認者</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/office/orders/${order.id}`}>
                      <strong>{order.number}</strong>
                    </Link>
                  </td>
                  <td>{projectName(order.projectId)}</td>
                  <td>{vendorName(order.vendorId)}</td>
                  <td>{order.trade}</td>
                  <td>{yen(order.amount + order.tax)}</td>
                  <td>{order.period}</td>
                  <td>{order.approver}</td>
                  <td>
                    <StatusBadge status={order.status} />
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
