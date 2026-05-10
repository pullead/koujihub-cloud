import { AssessmentTable } from "@/components/assessment-table";
import { Icon } from "@/components/icons";
import { Bar, PageHeader } from "@/components/ui";
import { departments, paymentAssessments } from "@/lib/mock-data";

export default function PaymentAssessmentsPage() {
  return (
    <section className="view">
      <PageHeader title="業者別支払査定入力表" description="今回支払予定額 = 今回査定金額 - 控除額 / 残額 = 注文金額 - 前回累計 - 今回支払予定">
        <select className="control">
          <option>2026年04月</option>
          <option>2026年03月</option>
        </select>
        <select className="control">
          <option>全部門</option>
          {departments.map((department) => (
            <option key={department}>{department}</option>
          ))}
        </select>
        <button className="button primary" type="button">
          <Icon name="check" />
          一括確認
        </button>
        <button className="button" type="button">
          <Icon name="download" />
          Excel
        </button>
      </PageHeader>

      <section className="panel">
        <AssessmentTable rows={paymentAssessments} />
      </section>

      <div className="split even">
        <section className="panel">
          <h3>確認ルート</h3>
          <div className="flow" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", marginTop: 14 }}>
            <div className="flow-node">
              <strong>現場監督</strong>
              <span>出来高・査定金額入力</span>
            </div>
            <div className="flow-node">
              <strong>部門長</strong>
              <span>妥当性確認・差戻し</span>
            </div>
            <div className="flow-node">
              <strong>総務</strong>
              <span>注文・請求・帳票照合</span>
            </div>
            <div className="flow-node">
              <strong>経理</strong>
              <span>支払予定へ連携</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h3>入力状況</h3>
          <div className="timeline" style={{ marginTop: 14 }}>
            <Bar label="未入力" value={18} tone="amber" valueLabel={`${paymentAssessments.filter((row) => row.status === "未入力").length}件`} />
            <Bar label="入力中" value={36} tone="blue" valueLabel={`${paymentAssessments.filter((row) => row.status === "入力中").length}件`} />
            <Bar label="確認済" value={68} valueLabel={`${paymentAssessments.filter((row) => row.status.includes("確認済")).length}件`} />
            <Bar label="差戻し" value={16} tone="red" valueLabel={`${paymentAssessments.filter((row) => row.status === "差戻し").length}件`} />
          </div>
        </section>
      </div>
    </section>
  );
}
