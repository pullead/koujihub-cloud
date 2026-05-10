import type { Role } from "./types";

export type CurrentUser = {
  id: string;
  companyId: string;
  departmentId: string;
  name: string;
  email: string;
  role: Role;
};

const demoUser: CurrentUser = {
  id: "user-general-affairs",
  companyId: "company-tokyo-kensetsu",
  departmentId: "department-general-affairs",
  name: "田中 美咲",
  email: "misaki.tanaka@tokyo-kensetsu.example",
  role: "GENERAL_AFFAIRS",
};

export async function getCurrentUser() {
  return demoUser;
}

export async function requireAuth() {
  return demoUser;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}
