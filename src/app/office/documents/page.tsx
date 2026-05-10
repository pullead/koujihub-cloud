import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getDocumentList, getProjectList, getVendorList } from "@/lib/db-data";
import { createDocumentAction } from "./actions";

export const dynamic = "force-dynamic";

const documentTypes = ["契約書", "注文書", "注文請書", "請求書", "支払状況表", "査定表", "工程表", "施工計画書", "安全書類", "写真台帳", "検査報告書", "その他"];
const departmentOptions = [
  ["ARCH", "建築"],
  ["CIVIL", "土木"],
  ["MATERIALS", "資材"],
  ["RECYCLE", "リサイクル"],
  ["GA", "総務"],
] as const;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [documents, projects, vendors] = await Promise.all([getDocumentList(user.companyId), getProjectList(user.companyId), getVendorList(user.companyId)]);
  const projectName = (projectId: string) => projects.find((project) => project.id === projectId)?.name ?? "-";
  const vendorName = (vendorId: string | null) => (vendorId ? vendors.find((vendor) => vendor.id === vendorId)?.name ?? "-" : "-");

  return (
    <section className="view">
      <PageHeader title="帳票・書類管理" description="案件、業者、部門、注文、請求に紐付く PDF・Excel・台帳を履歴保存">
        <select className="control">
          <option>帳票種別すべて</option>
          <option>注文請書</option>
          <option>請求書</option>
          <option>査定表</option>
        </select>
        <a className="button primary" href="#new-document">
          <Icon name="plus" />
          アップロード
        </a>
      </PageHeader>

      {query.error ? <div className="message error">保存できませんでした。ファイル選択、関連する案件・業者、DATABASE_URL と Prisma の状態を確認してください。</div> : null}
      {query.created ? <div className="message success">帳票ファイルをアップロードし、v1 として登録しました。</div> : null}

      <section className="panel" id="new-document">
        <div className="section-title">
          <div>
            <h3>帳票アップロード</h3>
            <p>ファイル実体をローカル保存し、DocumentVersion v1 として Prisma に登録します。</p>
          </div>
        </div>
        <form action={createDocumentAction} className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-field">
            <label htmlFor="documentType">帳票種別</label>
            <select id="documentType" name="documentType" defaultValue="請求書">
              {documentTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="title">タイトル</label>
            <input id="title" name="title" required placeholder="INV-2605-001 請求書" />
          </div>
          <div className="form-field">
            <label htmlFor="status">状態</label>
            <select id="status" name="status" defaultValue="checking">
              <option value="draft">下書き</option>
              <option value="checking">確認中</option>
              <option value="pending_approval">承認待ち</option>
              <option value="approved">承認済</option>
              <option value="stored">保管済</option>
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="projectId">案件</label>
            <select id="projectId" name="projectId" defaultValue="">
              <option value="">未指定</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} / {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="vendorId">業者</label>
            <select id="vendorId" name="vendorId" defaultValue="">
              <option value="">未指定</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.code} / {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="departmentCode">部門</label>
            <select id="departmentCode" name="departmentCode" defaultValue="GA">
              {departmentOptions.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field full">
            <label htmlFor="file">ファイル</label>
            <input id="file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.csv,image/*,application/pdf" />
          </div>
          <div className="form-field full">
            <button className="button primary" type="submit">
              <Icon name="plus" />
              Prisma に帳票を保存
            </button>
          </div>
        </form>
      </section>

      <div className="split">
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>帳票種別</th>
                  <th>タイトル</th>
                  <th>案件</th>
                  <th>業者</th>
                  <th>部門</th>
                  <th>版</th>
                  <th>状態</th>
                  <th>更新</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.type}</td>
                    <td>
                      <Link href={`/office/documents/${document.id}`}>
                        <strong>{document.title}</strong>
                      </Link>
                      <br />
                      <span className="muted">{document.owner}</span>
                    </td>
                    <td>{projectName(document.projectId)}</td>
                    <td>{vendorName(document.vendorId)}</td>
                    <td>{document.department}</td>
                    <td>{document.version}</td>
                    <td>
                      <StatusBadge status={document.status} />
                    </td>
                    <td>{document.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="panel">
          <h3>PDF プレビュー</h3>
          <div className="drawing-thumb" style={{ marginTop: 14, minHeight: 260 }}>
            <div className="thumb-caption">
              <strong>帳票プレビュー</strong>
              <StatusBadge status="最新版" />
            </div>
          </div>
          <div className="timeline" style={{ marginTop: 14 }}>
            <div className="notice">
              <strong>v3 最新版</strong>
              <span>2026-04-29 田中 美咲がアップロード</span>
            </div>
            <div className="notice">
              <strong>v2 差替</strong>
              <span>2026-04-27 ファイル名修正</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
