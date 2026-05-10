export type ProjectStatus =
  | "引合"
  | "見積中"
  | "受注"
  | "着工前"
  | "施工中"
  | "検査中"
  | "竣工"
  | "引渡済"
  | "請求中"
  | "完了"
  | "保留"
  | "取消";

export type VendorStatus = "取引中" | "新規申請中" | "休止中" | "取引停止" | "要確認";

export type OrderStatus =
  | "未作成"
  | "作成中"
  | "承認待ち"
  | "承認済"
  | "送付済"
  | "注文請書待ち"
  | "注文請書回収済"
  | "変更あり"
  | "取消";

export type InvoiceStatus =
  | "未確認"
  | "確認中"
  | "差戻し"
  | "承認待ち"
  | "承認済"
  | "支払予定"
  | "支払済"
  | "保留";

export type AssessmentStatus =
  | "未入力"
  | "入力中"
  | "現場確認済"
  | "部門確認済"
  | "総務確認済"
  | "経理確認済"
  | "差戻し"
  | "締め済";

export type DocumentStatus = "下書き" | "確認中" | "承認待ち" | "承認済" | "差戻し" | "保管済";

export type Role =
  | "SYSTEM_ADMIN"
  | "COMPANY_ADMIN"
  | "EXECUTIVE"
  | "GENERAL_AFFAIRS"
  | "ACCOUNTING"
  | "DEPARTMENT_MANAGER"
  | "SITE_MANAGER"
  | "SALES"
  | "VENDOR_ADMIN"
  | "VENDOR_WORKER"
  | "VIEWER";

export type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  site: string;
  type: string;
  department: string;
  manager: string;
  status: ProjectStatus;
  start: string;
  end: string;
  contract: number;
  progress: number;
  tasks: number;
  late: number;
  docsMissing: number;
  unreadDrawings: number;
  dailyReport: "未提出" | "提出済" | "対象外" | "完了";
  isJv: boolean;
};

export type Vendor = {
  id: string;
  code: string;
  name: string;
  kana: string;
  trade: string;
  status: VendorStatus;
  invoice: string;
  license: string;
  contact: string;
  phone: string;
  email: string;
  bank: string;
  safety: "有効" | "30日以内更新" | "期限切れ" | "提出待ち";
  rating: "A" | "B" | "C" | "-";
  projects: number;
};

export type Order = {
  id: string;
  number: string;
  projectId: string;
  vendorId: string;
  department: string;
  trade: string;
  title: string;
  amount: number;
  tax: number;
  date: string;
  period: string;
  status: OrderStatus;
  approver: string;
};

export type Invoice = {
  id: string;
  number: string;
  projectId: string;
  vendorId: string;
  orderId: string;
  date: string;
  due: string;
  amount: number;
  deduction: number;
  status: InvoiceStatus;
  checkedBy: string;
};

export type DocumentRecord = {
  id: string;
  type: string;
  title: string;
  projectId: string;
  vendorId: string | null;
  department: string;
  status: DocumentStatus;
  version: string;
  updated: string;
  owner: string;
};

export type DocumentVersionRecord = {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type DocumentDetail = DocumentRecord & {
  versions: DocumentVersionRecord[];
};

export type PaymentAssessment = {
  id: string;
  projectId: string;
  vendorId: string;
  orderId: string;
  previous: number;
  progressAmount: number;
  assessed: number;
  deduction: number;
  status: AssessmentStatus;
  comment: string;
};

export type Approval = {
  id: string;
  targetId?: string;
  targetType?: string;
  target: string;
  title: string;
  route: string;
  requester: string;
  status: "承認待ち" | "確認中" | "差戻し" | "承認済";
  due: string;
};

export type ApprovalStepRecord = {
  id: string;
  order: number;
  role: string;
  status: string;
  comment: string | null;
  actedAt: string | null;
};

export type TargetApprovalRecord = Approval & {
  steps: ApprovalStepRecord[];
};

export type TargetWorkflowHistory = {
  currentStatus: "未申請" | "確認中" | "承認待ち" | "承認済" | "差戻し";
  hasPendingApproval: boolean;
  approvals: TargetApprovalRecord[];
  auditLogs: AuditLog[];
  notifications: Notification[];
};

export type Notification = {
  id?: string;
  title: string;
  body: string;
  unread: boolean;
  targetType?: string | null;
  targetId?: string | null;
};

export type ScheduleItem = {
  projectId: string;
  name: string;
  start: number;
  width: number;
  progress: number;
  owner: string;
  status: string;
  tone: "blue" | "amber" | "green" | "red" | "dark";
};

export type PhotoRecord = {
  projectId: string;
  category: string;
  trade: string;
  place: string;
  date: string;
  vendor: string;
};

export type AuditLog = {
  id?: string;
  user: string;
  action: string;
  target: string;
  time: string;
};
