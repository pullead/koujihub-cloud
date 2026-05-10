import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/ui";
import { photos, projects } from "@/lib/mock-data";

export default function MobilePage() {
  const project = projects[0];
  const actions: Array<[IconName, string, string]> = [
    ["dashboard", "工程を見る", "空調配管 / 電気配線"],
    ["file", "最新版図面", "A-101 v3 / E-204 v2"],
    ["plus", "写真を撮る", "電子黒板付き"],
    ["clipboard", "日報を提出", "作業人数・材料・安全事項"],
    ["check", "是正確認", "確認待ち 2件"],
  ];

  return (
    <section className="view">
      <PageHeader title="現場モバイル PWA" description="現場監督・職人・協力会社向けのスマホ入力画面">
        <button className="button" type="button">
          <Icon name="download" />
          オフライン同期
        </button>
      </PageHeader>

      <div className="split even">
        <div className="mobile-frame">
          <div className="mobile-head">
            <div>
              <strong>今日の作業</strong>
              <div style={{ color: "#c8d8d2", fontSize: 12 }}>{project.name}</div>
            </div>
            <StatusBadge status="施工中" />
          </div>
          <div className="mobile-body">
            {actions.map(([iconName, title, body]) => (
              <div className="mobile-action" key={title}>
                <Icon name={iconName} />
                <div>
                  <strong>{title}</strong>
                  <br />
                  <span className="muted">{body}</span>
                </div>
                <Icon name="arrow" />
              </div>
            ))}
          </div>
        </div>
        <section className="panel">
          <h3>現場入力と本社連携</h3>
          <div className="key-values" style={{ marginTop: 14 }}>
            <div className="kv">
              <span>今日の写真</span>
              <strong>18枚</strong>
            </div>
            <div className="kv">
              <span>図面閲覧</span>
              <strong>最新版のみ</strong>
            </div>
            <div className="kv">
              <span>日報</span>
              <strong>未提出</strong>
            </div>
            <div className="kv">
              <span>是正</span>
              <strong>確認待ち 2件</strong>
            </div>
          </div>
          <div className="photo-grid" style={{ marginTop: 14 }}>
            {photos.slice(0, 2).map((photo) => (
              <div className="photo-thumb" key={`${photo.category}-${photo.place}`}>
                <div className="blackboard">
                  <strong>{photo.category}</strong>
                  <span>
                    {photo.trade} / {photo.place}
                  </span>
                  <span>{photo.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
