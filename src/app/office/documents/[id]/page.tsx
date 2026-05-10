import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { WorkflowHistoryPanel } from "@/components/workflow-history";
import { requestApprovalAction } from "@/app/approvals/actions";
import { requireAuth } from "@/lib/auth";
import { getDocumentById, getProjectList, getVendorList } from "@/lib/db-data";
import { getTargetWorkflowHistory } from "@/lib/workflow-data";
import { updateDocumentStatusAction, uploadDocumentVersionAction } from "../actions";

const documentStatusOptions = [
  ["draft", "下書き"],
  ["checking", "確認中"],
  ["pending_approval", "承認待ち"],
  ["approved", "承認済"],
  ["stored", "保管済"],
] as const;

export const dynamic = "force-dynamic";

function formatBytes(value: number | null) {
  if (value == null) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; updated?: string; uploaded?: string; approval?: string; duplicate?: string }> }) {
  const { id } = await params;
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const [document, projects, vendors, history] = await Promise.all([getDocumentById(user.companyId, id), getProjectList(user.companyId), getVendorList(user.companyId), getTargetWorkflowHistory(user.companyId, "Document", id)]);

  if (!document) {
    notFound();
  }

  const project = projects.find((candidate) => candidate.id === document.projectId);
  const vendor = document.vendorId ? vendors.find((candidate) => candidate.id === document.vendorId) : null;
  const latestVersion = document.versions[0];
  const canPreview = latestVersion?.fileUrl && latestVersion.fileUrl !== "#";

  return (
    <section className="view">
      <PageHeader title={document.title} description={`${document.type} / ${project?.name ?? "案件未設定"} / ${vendor?.name ?? "業者未設定"}`}>
        <StatusBadge status={document.status} />
        <Link className="button" href="/office/documents">
          一覧へ戻る
        </Link>
      </PageHeader>

      {query.error ? <div className="message error">状態を更新できませんでした。DATABASE_URL と対象データを確認してください。</div> : null}
      {query.updated ? <div className="message success">帳票の状態を更新しました。</div> : null}
      {query.uploaded ? <div className="message success">新しいファイルをアップロードし、最新版を更新しました。</div> : null}
      {query.approval ? <div className="message success">帳票の承認申請を作成しました。</div> : null}
      {query.duplicate ? <div className="message">承認待ちの申請がすでにあります。</div> : null}

      <div className="split even">
        <section className="panel">
          <div className="section-title">
            <div>
              <h3>帳票概要</h3>
              <p>案件・業者・部門に紐付いた帳票を版数込みで管理します。</p>
            </div>
          </div>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>種別</span>
              <strong>{document.type}</strong>
            </div>
            <div className="kv">
              <span>最新版</span>
              <strong>{document.version}</strong>
            </div>
            <div className="kv">
              <span>部門</span>
              <strong>{document.department}</strong>
            </div>
            <div className="kv">
              <span>更新者</span>
              <strong>{document.owner}</strong>
            </div>
            <div className="kv">
              <span>更新日時</span>
              <strong>{document.updated}</strong>
            </div>
            <div className="kv">
              <span>状態</span>
              <strong>{document.status}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">
            <div>
              <h3>状態更新</h3>
              <p>確認、承認、保管済までの状態を Prisma に保存します。</p>
            </div>
          </div>
          <form action={updateDocumentStatusAction} className="form-grid" style={{ marginTop: 14 }}>
            <input name="documentId" type="hidden" value={document.id} />
            <div className="form-field wide">
              <label htmlFor="status">次の状態</label>
              <select id="status" name="status" defaultValue="approved">
                {documentStatusOptions.map(([value, label]) => (
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
              <input name="targetType" type="hidden" value="Document" />
              <input name="targetId" type="hidden" value={document.id} />
              <input name="title" type="hidden" value={`${document.type} ${document.title}`} />
              <input name="sourcePath" type="hidden" value={`/office/documents/${document.id}`} />
              <div className="form-field full">
                <button className="button" type="submit">
                  <Icon name="check" />
                  承認申請を作成
                </button>
              </div>
            </form>
          )}

          <div className="section-title" style={{ marginTop: 22 }}>
            <div>
              <h3>新版アップロード</h3>
              <p>差替ファイルを追加し、DocumentVersion を v2、v3 と積み上げます。</p>
            </div>
          </div>
          <form action={uploadDocumentVersionAction} className="form-grid" style={{ marginTop: 14 }}>
            <input name="documentId" type="hidden" value={document.id} />
            <div className="form-field wide">
              <label htmlFor="versionFile">差替ファイル</label>
              <input id="versionFile" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.csv,image/*,application/pdf" />
            </div>
            <div className="form-field wide">
              <label htmlFor="versionStatus">保存後の状態</label>
              <select id="versionStatus" name="status" defaultValue="checking">
                <option value="checking">確認中</option>
                <option value="pending_approval">承認待ち</option>
                <option value="approved">承認済</option>
                <option value="stored">保管済</option>
              </select>
            </div>
            <div className="form-field full">
              <button className="button primary" type="submit">
                <Icon name="plus" />
                新版をアップロード
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>プレビュー</h3>
            <p>最新版ファイルのダウンロードリンクと、アップロード履歴を確認できます。</p>
          </div>
          <StatusBadge status="最新版" />
        </div>
        {canPreview ? (
          <div className="notice" style={{ marginTop: 14 }}>
            <strong>{latestVersion.fileName}</strong>
            <span>
              {document.version} / {formatBytes(latestVersion.fileSize)} / {latestVersion.mimeType}
            </span>
            <a className="button" href={latestVersion.fileUrl} target="_blank" rel="noreferrer" style={{ width: "fit-content", marginTop: 8 }}>
              <Icon name="download" />
              ファイルを開く
            </a>
          </div>
        ) : (
          <div className="drawing-thumb" style={{ minHeight: 280, marginTop: 14 }}>
            <div className="thumb-caption">
              <strong>{document.title}</strong>
              <span>{document.version}</span>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>版履歴</h3>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>版</th>
                <th>ファイル名</th>
                <th>サイズ</th>
                <th>MIME</th>
                <th>アップロード者</th>
                <th>日時</th>
                <th>リンク</th>
              </tr>
            </thead>
            <tbody>
              {document.versions.map((version) => (
                <tr key={version.id}>
                  <td>
                    <strong>v{version.version}</strong>
                  </td>
                  <td>{version.fileName}</td>
                  <td>{formatBytes(version.fileSize)}</td>
                  <td>{version.mimeType}</td>
                  <td>{version.uploadedBy}</td>
                  <td>{version.uploadedAt}</td>
                  <td>
                    {version.fileUrl === "#" ? (
                      "-"
                    ) : (
                      <a href={version.fileUrl} target="_blank" rel="noreferrer">
                        開く
                      </a>
                    )}
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
