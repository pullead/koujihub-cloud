import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProjectList } from "@/lib/db-data";

export async function GET() {
  const user = await requireAuth();
  const projects = await getProjectList(user.companyId);

  return NextResponse.json({
    companyId: user.companyId,
    data: projects,
  });
}
