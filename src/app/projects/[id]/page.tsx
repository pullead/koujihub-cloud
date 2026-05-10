import { notFound } from "next/navigation";
import { MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { auditLogs, documents, paymentAssessments, photos, schedules } from "@/lib/mock-data";
import { requireAuth } from "@/lib/auth";
import { getInvoiceList, getOrderList, getProjectById, getVendorList } from "@/lib/db-data";
import { yen, sum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [project, allOrders, allInvoices, allVendors] = await Promise.all([getProjectById(user.companyId, id), getOrderList(user.companyId), getInvoiceList(user.companyId), getVendorList(user.companyId)]);

  if (!project) {
    notFound();
  }

  const projectOrders = allOrders.filter((order) => order.projectId === project.id);
  const projectInvoices = allInvoices.filter((invoice) => invoice.projectId === project.id);
  const projectDocuments = documents.filter((document) => document.projectId === project.id);
  const projectAssessments = paymentAssessments.filter((assessment) => assessment.projectId === project.id);
  const vendorName = (vendorId: string) => allVendors.find((vendor) => vendor.id === vendorId)?.name ?? "-";

  return (
    <section className="view">
      <PageHeader title={project.name} description={`${project.code} / ${project.site} / ${project.department} / ${project.manager}`}>
        <StatusBadge status={project.status} />
        <button className="button" type="button">
          完成資料 ZIP
        </button>
      </PageHeader>

      {query.created ? <div className="message success">案件を登録しました。次に関係者、注文、帳票を紐付けできます。</div> : null}

      <div className="grid cols-4">
        <MetricCard label="進捗率" value={`${project.progress}%`} detail={`${project.start} - ${project.end}`} tone="blue" icon="dashboard" />
        <MetricCard label="注文金額" value={yen(sum(projectOrders, (order) => order.amount + order.tax))} detail="注文書・注文請書" icon="order" />
        <MetricCard label="未処理タスク" value={project.tasks} detail={`遅延 ${project.late}件`} tone={project.late ? "red" : "amber"} icon="check" />
        <MetricCard label="不足帳票" value={project.docsMissing} detail="総務確認待ち" tone="violet" icon="file" />
      </div>

      <div className="split even">
        <section className="panel">
          <h3>概要</h3>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>施主</span>
              <strong>{project.client}</strong>
            </div>
            <div className="kv">
              <span>工事種別</span>
              <strong>{project.type}</strong>
            </div>
            <div className="kv">
              <span>契約金額</span>
              <strong>{yen(project.contract)}</strong>
            </div>
            <div className="kv">
              <span>JV 区分</span>
              <strong>{project.isJv ? "JV 工事" : "通常工事"}</strong>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>案件内データ連携</h3>
          <div className="flow" style={{ gridTemplateColumns: "1fr", marginTop: 14 }}>
            <div className="flow-node">
              <strong>工程</strong>
              <span>工程ごとに写真・日報・是正を紐付け</span>
            </div>
            <div className="flow-node">
              <strong>図面</strong>
              <span>A-101 v3 が最新版。旧版閲覧時は警告</span>
            </div>
            <div className="flow-node">
              <strong>注文・請求</strong>
              <span>注文番号単位で請求書、査定、支払に接続</span>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>工程表</h3>
        <div className="timeline" style={{ marginTop: 14 }}>
          {schedules
            .filter((schedule) => schedule.projectId === project.id)
            .map((schedule) => (
              <div className="timeline-row" key={schedule.name}>
                <strong>{schedule.name}</strong>
                <div className="gantt">
                  <span className={schedule.tone} style={{ left: `${schedule.start}%`, width: `${schedule.width}%` }} />
                </div>
                <StatusBadge status={schedule.status} />
              </div>
            ))}
        </div>
      </section>

      <section className="panel">
        <h3>写真・図面</h3>
        <div className="photo-grid" style={{ marginTop: 14 }}>
          {photos
            .filter((photo) => photo.projectId === project.id)
            .map((photo) => (
              <div className="photo-thumb" key={`${photo.category}-${photo.place}`}>
                <div className="blackboard">
                  <strong>{project.name}</strong>
                  <span>
                    {photo.trade} / {photo.place}
                  </span>
                  <span>
                    {photo.date} / {photo.vendor}
                  </span>
                </div>
              </div>
            ))}
          {["A-101 平面図", "E-204 電気配線図", "M-301 空調設備図"].map((drawing, index) => (
            <div className="drawing-thumb" key={drawing}>
              <div className="thumb-caption">
                <strong>{drawing}</strong>
                <StatusBadge status={index === 0 ? "最新版 v3" : "最新版 v2"} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>注文・請求・査定</h3>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>注文番号</th>
                <th>業者</th>
                <th>注文金額</th>
                <th>請求</th>
                <th>査定</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {projectOrders.map((order) => {
                const invoice = projectInvoices.find((candidate) => candidate.orderId === order.id);
                const assessment = projectAssessments.find((candidate) => candidate.orderId === order.id);
                return (
                  <tr key={order.id}>
                    <td>{order.number}</td>
                    <td>{vendorName(order.vendorId)}</td>
                    <td>{yen(order.amount + order.tax)}</td>
                    <td>{invoice ? yen(invoice.amount) : "-"}</td>
                    <td>{assessment ? yen(assessment.assessed - assessment.deduction) : "-"}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="split even">
        <section className="panel">
          <h3>帳票</h3>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>種別</th>
                  <th>タイトル</th>
                  <th>版</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {projectDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>{document.type}</td>
                    <td>{document.title}</td>
                    <td>{document.version}</td>
                    <td>
                      <StatusBadge status={document.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>履歴ログ</h3>
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
