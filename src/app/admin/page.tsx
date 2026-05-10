import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { departments } from "@/lib/mock-data";

const headers = ["機能", "総務", "経理", "現場監督", "部門長", "協力会社"];
const rows = [
  ["案件查看", "○", "○", "担当のみ", "部門のみ", "関係のみ"],
  ["案件編集", "○", "△", "担当のみ", "△", "×"],
  ["写真アップロード", "△", "×", "○", "△", "○"],
  ["図面アップロード", "○", "×", "○", "△", "×"],
  ["注文書作成", "○", "△", "△", "承認", "×"],
  ["請求書管理", "○", "○", "△", "承認", "△"],
  ["査定入力", "確認", "最終確認", "入力", "承認", "×"],
];

export default function AdminPage() {
  return (
    <section className="view">
      <PageHeader title="管理設定" description="会社、部門、ユーザー、権限、帳票テンプレート、監査ログの管理">
        <Link className="button" href="/admin/system">
          <Icon name="database" />
          システム状態
        </Link>
        <button className="button primary" type="button">
          <Icon name="check" />
          保存
        </button>
      </PageHeader>

      <div className="split even">
        <section className="panel">
          <h3>権限マトリクス</h3>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>マスタ</h3>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>会社</span>
              <strong>東京建設株式会社</strong>
            </div>
            <div className="kv">
              <span>companyId</span>
              <strong>tokyo-kensetsu</strong>
            </div>
            <div className="kv">
              <span>部門</span>
              <strong>{departments.length}部門</strong>
            </div>
            <div className="kv">
              <span>ユーザー</span>
              <strong>42名</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>開発フェーズ</h3>
        <div className="flow" style={{ marginTop: 14 }}>
          <div className="flow-node">
            <strong>Phase 1 MVP</strong>
            <span>案件、業者、帳票、注文、請求、支払</span>
          </div>
          <div className="flow-node">
            <strong>Phase 2 総務強化</strong>
            <span>査定入力、支払状況表、承認、Excel</span>
          </div>
          <div className="flow-node">
            <strong>Phase 3 現場強化</strong>
            <span>写真台帳、日報、図面注釈、PWA</span>
          </div>
          <div className="flow-node">
            <strong>Phase 4 経営可視化</strong>
            <span>原価、粗利、部門分析、業者評価</span>
          </div>
          <div className="flow-node">
            <strong>Phase 5 拡張</strong>
            <span>AI OCR、BIM、会計連携、電子契約</span>
          </div>
          <div className="flow-node">
            <strong>運用</strong>
            <span>WAF、監査、バックアップ、MFA</span>
          </div>
        </div>
      </section>
    </section>
  );
}
