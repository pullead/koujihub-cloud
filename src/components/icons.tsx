export type IconName =
  | "dashboard"
  | "building"
  | "folder"
  | "clipboard"
  | "users"
  | "file"
  | "order"
  | "yen"
  | "calculator"
  | "ledger"
  | "database"
  | "check"
  | "mobile"
  | "settings"
  | "search"
  | "bell"
  | "plus"
  | "download"
  | "arrow";

const paths: Record<IconName, string> = {
  dashboard: "M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z",
  building: "M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M2 21h20M8 7h1M12 7h1M8 11h1M12 11h1M8 15h1M12 15h1",
  folder: "M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z",
  clipboard: "M9 3h6l1 2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2l1-2ZM9 9h6M9 13h6M9 17h4",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M8 13h8M8 17h6",
  order: "M7 3h10l2 4v14H5V7l2-4ZM7 7h10M9 12h6M9 16h6",
  yen: "M12 3 7 10h10l-5-7ZM12 10v11M8 14h8M8 18h8",
  calculator: "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5ZM8 7h8M8 11h2M12 11h2M16 11h1M8 15h2M12 15h2M16 15h1M8 19h6",
  ledger: "M5 3h14v18H5zM9 3v18M13 7h3M13 11h3M13 15h3",
  database: "M4 6c0-2 16-2 16 0s-16 2-16 0Zm0 0v6c0 2 16 2 16 0V6M4 12v6c0 2 16 2 16 0v-6",
  check: "m4 12 5 5L20 6M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  mobile: "M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4ZM11 18h2",
  settings: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15l.3 2.1-2 1.7-2-.9a7.5 7.5 0 0 1-1.8 1l-.3 2.1h-3.2l-.3-2.1a7.5 7.5 0 0 1-1.8-1l-2 .9-2-1.7.3-2.1a7.5 7.5 0 0 1-.6-2l-1.8-1.2 1.6-2.8 2.1.2a7.5 7.5 0 0 1 1.5-1.3l.4-2.1h3.2l.4 2.1c.5.3 1 .7 1.5 1.3l2.1-.2 1.6 2.8-1.8 1.2c-.1.7-.3 1.4-.6 2Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-3.5-3.5",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  plus: "M12 5v14M5 12h14",
  download: "M12 3v12m-5-5 5 5 5-5M5 21h14",
  arrow: "M5 12h14m-6-6 6 6-6 6",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
