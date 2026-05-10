import { Icon } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getVendorList } from "@/lib/db-data";
import { createVendorAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [user, query] = await Promise.all([requireAuth(), searchParams]);
  const vendors = await getVendorList(user.companyId);
  const selected = vendors[0];

  return (
    <section className="view">
      <PageHeader title="業者・協力会社台帳" description="支払先、許可、インボイス、安全書類、評価、案件履歴を一元管理">
        <select className="control">
          <option>取引状態すべて</option>
          <option>取引中</option>
          <option>要確認</option>
        </select>
        <a className="button primary" href="#new-vendor">
          <Icon name="plus" />
          業者登録
        </a>
      </PageHeader>

      {query.error ? <div className="message error">保存できませんでした。PostgreSQL が起動しているか、DATABASE_URL と Prisma migrate/db push を確認してください。</div> : null}
      {query.created ? <div className="message success">業者を登録しました。</div> : null}

      <section className="panel" id="new-vendor">
        <div className="section-title">
          <div>
            <h3>業者新規登録</h3>
            <p>業者台帳と既定銀行口座を Server Action で同時に保存します。</p>
          </div>
        </div>
        <form action={createVendorAction} className="form-grid" style={{ marginTop: 14 }}>
          <div className="form-field">
            <label htmlFor="vendorCode">業者コード</label>
            <input id="vendorCode" name="vendorCode" required placeholder="V-0070" />
          </div>
          <div className="form-field wide">
            <label htmlFor="name">会社名</label>
            <input id="name" name="name" required placeholder="新日本設備株式会社" />
          </div>
          <div className="form-field">
            <label htmlFor="nameKana">会社名カナ</label>
            <input id="nameKana" name="nameKana" placeholder="シンニホンセツビ" />
          </div>
          <div className="form-field">
            <label htmlFor="licenseType">対応工種</label>
            <input id="licenseType" name="licenseType" required placeholder="空調・衛生設備" />
          </div>
          <div className="form-field">
            <label htmlFor="tradeStatus">取引状態</label>
            <select id="tradeStatus" name="tradeStatus" defaultValue="active">
              <option value="active">取引中</option>
              <option value="applying">新規申請中</option>
              <option value="needs_review">要確認</option>
              <option value="suspended">休止中</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="invoiceRegistrationNumber">インボイス番号</label>
            <input id="invoiceRegistrationNumber" name="invoiceRegistrationNumber" placeholder="T1234567890123" />
          </div>
          <div className="form-field">
            <label htmlFor="constructionLicenseNumber">建設業許可番号</label>
            <input id="constructionLicenseNumber" name="constructionLicenseNumber" placeholder="東京都知事許可 般-6 第00000号" />
          </div>
          <div className="form-field">
            <label htmlFor="mainContactName">担当者</label>
            <input id="mainContactName" name="mainContactName" placeholder="山田 太郎" />
          </div>
          <div className="form-field">
            <label htmlFor="phone">電話</label>
            <input id="phone" name="phone" placeholder="03-0000-0000" />
          </div>
          <div className="form-field">
            <label htmlFor="email">メール</label>
            <input id="email" name="email" type="email" placeholder="contact@example.jp" />
          </div>
          <div className="form-field">
            <label htmlFor="bankName">銀行名</label>
            <input id="bankName" name="bankName" placeholder="みずほ銀行" />
          </div>
          <div className="form-field">
            <label htmlFor="branchName">支店名</label>
            <input id="branchName" name="branchName" placeholder="本店" />
          </div>
          <div className="form-field">
            <label htmlFor="accountType">口座種別</label>
            <select id="accountType" name="accountType" defaultValue="普通">
              <option>普通</option>
              <option>当座</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="accountNumber">口座番号</label>
            <input id="accountNumber" name="accountNumber" placeholder="1234567" />
          </div>
          <div className="form-field">
            <label htmlFor="accountHolder">口座名義</label>
            <input id="accountHolder" name="accountHolder" placeholder="シンニホンセツビ（カ" />
          </div>
          <div className="form-field full">
            <button className="button primary" type="submit">
              <Icon name="plus" />
              Prisma に業者を保存
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
                  <th>業者コード</th>
                  <th>会社名</th>
                  <th>工種</th>
                  <th>インボイス</th>
                  <th>安全書類</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.code}</td>
                    <td>
                      <strong>{vendor.name}</strong>
                      <br />
                      <span className="muted">{vendor.kana}</span>
                    </td>
                    <td>{vendor.trade}</td>
                    <td>{vendor.invoice}</td>
                    <td>
                      <StatusBadge status={vendor.safety} />
                    </td>
                    <td>
                      <StatusBadge status={vendor.status} />
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
                <h3>{selected.name}</h3>
                <p>
                  {selected.code} / {selected.trade}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="key-values" style={{ marginTop: 14 }}>
              <div className="kv">
                <span>担当者</span>
                <strong>{selected.contact}</strong>
              </div>
              <div className="kv">
                <span>評価</span>
                <strong>{selected.rating}</strong>
              </div>
              <div className="kv">
                <span>電話</span>
                <strong>{selected.phone}</strong>
              </div>
              <div className="kv">
                <span>案件履歴</span>
                <strong>{selected.projects}件</strong>
              </div>
              <div className="kv">
                <span>支払先</span>
                <strong>{selected.bank}</strong>
              </div>
              <div className="kv">
                <span>建設業許可</span>
                <strong>{selected.license}</strong>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="panel">
            <div className="empty">業者がまだ登録されていません。</div>
          </aside>
        )}
      </div>
    </section>
  );
}
