import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader, Progress, StatusBadge } from "@/components/ui";
import { createProjectAction } from "./actions";
import { yen } from "@/lib/format";
import { requireAuth } from "@/lib/auth";
import { getProjectList } from "@/lib/db-data";

export const dynamic = "force-dynamic";

const departmentOptions = [
  ["ARCH", "建築"],
  ["CIVIL", "土木"],
  ["MATERIALS", "資材"],
  ["RECYCLE", "リサイクル"],
] as const;

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const projects = await getProjectList(user.companyId);

  return (
    <section className="view">
      <PageHeader title="案件・工事管理" description="すべての工程表、図面、写真、帳票、注文、請求、支払を projectId に集約">
        <select className="control" aria-label="ステータス">
          <option>すべての状態</option>
          <option>施工中</option>
          <option>着工前</option>
          <option>請求中</option>
        </select>
        <select className="control" aria-label="部門">
          <option>全部門</option>
          {departmentOptions.map(([, label]) => (
            <option key={label}>{label}</option>
          ))}
        </select>
        <a className="button primary" href="#new-project">
          <Icon name="plus" />
          案件新規作成
        </a>
      </PageHeader>

      {query.error ? <div className="message error">保存できませんでした。PostgreSQL が起動しているか、DATABASE_URL と Prisma migrate/db push を確認してください。</div> : null}
      {query.created ? <div className="message success">案件を登録しました。</div> : null}

      <section className="panel" id="new-project">
        <div className="section-title">
          <div>
            <h3>案件新規作成</h3>
            <p>Server Action で Prisma に保存し、companyId を自動付与します。</p>
          </div>
        </div>
        <form action={createProjectAction} className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-field">
            <label htmlFor="projectCode">工事番号</label>
            <input id="projectCode" name="projectCode" required placeholder="KJ-2026-050" />
          </div>
          <div className="form-field wide">
            <label htmlFor="name">工事名</label>
            <input id="name" name="name" required placeholder="新宿区テナント改修工事" />
          </div>
          <div className="form-field">
            <label htmlFor="departmentCode">部門</label>
            <select id="departmentCode" name="departmentCode" defaultValue="ARCH">
              {departmentOptions.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field wide">
            <label htmlFor="clientName">施主名</label>
            <input id="clientName" name="clientName" required placeholder="株式会社サンプル不動産" />
          </div>
          <div className="form-field wide">
            <label htmlFor="siteAddress">現場住所</label>
            <input id="siteAddress" name="siteAddress" required placeholder="東京都新宿区西新宿 1-1-1" />
          </div>
          <div className="form-field">
            <label htmlFor="constructionType">工事種別</label>
            <input id="constructionType" name="constructionType" required placeholder="内装・設備" />
          </div>
          <div className="form-field">
            <label htmlFor="status">状態</label>
            <select id="status" name="status" defaultValue="in_progress">
              <option value="before_start">着工前</option>
              <option value="in_progress">施工中</option>
              <option value="billing">請求中</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="startDate">着工日</label>
            <input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="form-field">
            <label htmlFor="endDate">竣工予定日</label>
            <input id="endDate" name="endDate" type="date" required />
          </div>
          <div className="form-field">
            <label htmlFor="contractAmount">契約金額</label>
            <input id="contractAmount" name="contractAmount" type="number" min="0" required placeholder="50000000" />
          </div>
          <div className="form-field full">
            <label htmlFor="memo">備考</label>
            <textarea id="memo" name="memo" rows={3} placeholder="注意事項、近隣対応、契約条件など" />
          </div>
          <div className="form-field full">
            <button className="button primary" type="submit">
              <Icon name="plus" />
              Prisma に案件を保存
            </button>
          </div>
        </form>
      </section>

      <div className="grid cols-2">
        {projects.map((project) => (
          <article className="record-card" key={project.id} style={{ padding: 14 }}>
            <div className="record-head">
              <div>
                <h3 style={{ fontSize: 15 }}>
                  <Link href={`/projects/${project.id}`}>{project.name}</Link>
                </h3>
                <div className="muted">
                  {project.code} / {project.site}
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="key-values" style={{ marginTop: 12 }}>
              <div className="kv">
                <span>施主</span>
                <strong>{project.client}</strong>
              </div>
              <div className="kv">
                <span>担当</span>
                <strong>
                  {project.department} / {project.manager}
                </strong>
              </div>
              <div className="kv">
                <span>工期</span>
                <strong>
                  {project.start} - {project.end}
                </strong>
              </div>
              <div className="kv">
                <span>契約金額</span>
                <strong>{yen(project.contract)}</strong>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Progress value={project.progress} tone={project.late ? "amber" : "blue"} />
              <div className="muted" style={{ marginTop: 8 }}>
                進捗 {project.progress}% / 未完了タスク {project.tasks}件 / 不足帳票 {project.docsMissing}件
              </div>
            </div>
            <div className="filter-row" style={{ marginTop: 12 }}>
              <Link className="button primary" href={`/projects/${project.id}`}>
                <Icon name="arrow" />
                詳細
              </Link>
              <Link className="button" href="/office/documents">
                <Icon name="file" />
                帳票
              </Link>
              <Link className="button" href="/office/invoices">
                <Icon name="yen" />
                支払
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="section-title">
          <div>
            <h3>部門別案件ボード</h3>
            <p>部門長・総務・経理が同じ案件状態を確認</p>
          </div>
        </div>
        <div className="kanban" style={{ marginTop: 14 }}>
          {["建築", "土木", "リサイクル", "請求中"].map((group) => {
            const groupedProjects = projects.filter((project) => project.department === group || project.status === group);
            return (
              <div className="kanban-column" key={group}>
                <h4>{group}</h4>
                {groupedProjects.length ? (
                  groupedProjects.map((project) => (
                    <div className="kanban-card" key={project.id}>
                      <strong>{project.name}</strong>
                      <span className="muted">
                        {project.code} / {project.manager}
                      </span>
                      <Progress value={project.progress} />
                    </div>
                  ))
                ) : (
                  <div className="empty">対象案件なし</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
