"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  count?: number;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: "dashboard" },
  { href: "/projects", label: "案件管理", icon: "building", count: 4 },
  { href: "/projects/p1", label: "案件詳細", icon: "folder" },
  { href: "/office/dashboard", label: "総務ダッシュボード", icon: "clipboard", count: 12 },
  { href: "/office/vendors", label: "業者台帳", icon: "users", count: 5 },
  { href: "/office/documents", label: "帳票・書類", icon: "file", count: 18 },
  { href: "/office/orders", label: "注文書・注文請書", icon: "order", count: 7 },
  { href: "/office/invoices", label: "請求・支払", icon: "yen", count: 9 },
  { href: "/office/payment-assessments", label: "査定入力", icon: "calculator", count: 6 },
  { href: "/office/payment-summaries", label: "支払状況表", icon: "ledger" },
  { href: "/approvals", label: "承認・通知", icon: "check", count: 8 },
  { href: "/m", label: "現場モバイル", icon: "mobile" },
  { href: "/admin", label: "管理設定", icon: "settings" },
  { href: "/admin/system", label: "システム状態", icon: "database" },
];

function currentLabel(pathname: string) {
  const exact = navItems.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const section = navItems.find((item) => pathname.startsWith(item.href) && item.href !== "/");
  return section?.label ?? "ダッシュボード";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="メインナビゲーション">
        <Link className="brand" href="/dashboard">
          <div className="brand-mark" aria-hidden="true">
            KH
          </div>
          <div>
            <h1>KoujiHub Cloud</h1>
            <p>現場と総務をつなぐ工事情報基盤</p>
          </div>
        </Link>
        <nav className="nav">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} className={`nav-link ${active ? "active" : ""}`} href={item.href}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.count ? <span className="nav-count">{item.count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar" aria-hidden="true">
            総
          </div>
          <div>
            <strong>本社総務</strong>
            <span>東京建設株式会社</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              <span>KoujiHub Cloud</span>
              <span>/</span>
              <span>{currentLabel(pathname)}</span>
            </div>
            <h2>{currentLabel(pathname)}</h2>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Icon name="search" />
              <input type="search" placeholder="案件・業者・注文・帳票を検索" />
            </label>
            <select className="control" aria-label="ロール" defaultValue="GENERAL_AFFAIRS">
              <option value="GENERAL_AFFAIRS">GENERAL_AFFAIRS</option>
              <option value="ACCOUNTING">ACCOUNTING</option>
              <option value="SITE_MANAGER">SITE_MANAGER</option>
              <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
              <option value="EXECUTIVE">EXECUTIVE</option>
            </select>
            <Link className="icon-button" href="/approvals" aria-label="通知">
              <Icon name="bell" />
            </Link>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
