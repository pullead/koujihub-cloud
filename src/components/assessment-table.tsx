"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui";
import { findOrder, findProject, findVendor } from "@/lib/mock-data";
import { yen } from "@/lib/format";
import type { PaymentAssessment } from "@/lib/types";

export function AssessmentTable({ rows }: { rows: PaymentAssessment[] }) {
  const [assessments, setAssessments] = useState(rows);

  const totalScheduled = useMemo(() => assessments.reduce((total, row) => total + row.assessed - row.deduction, 0), [assessments]);

  function update(id: string, field: "progressAmount" | "assessed" | "deduction", value: number) {
    setAssessments((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              status: row.status === "未入力" ? "入力中" : row.status,
            }
          : row,
      ),
    );
  }

  return (
    <div className="view">
      <div className="key-values">
        <div className="kv">
          <span>今回支払予定合計</span>
          <strong>{yen(totalScheduled)}</strong>
        </div>
        <div className="kv">
          <span>入力中・未入力</span>
          <strong>{assessments.filter((row) => ["未入力", "入力中"].includes(row.status)).length}件</strong>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>案件</th>
              <th>業者</th>
              <th>注文番号</th>
              <th>注文金額</th>
              <th>前回累計</th>
              <th>今回出来高</th>
              <th>今回査定</th>
              <th>控除</th>
              <th>支払予定</th>
              <th>残額</th>
              <th>状態</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((row) => {
              const order = findOrder(row.orderId);
              const scheduled = row.assessed - row.deduction;
              const balance = (order?.amount ?? 0) - row.previous - scheduled;

              return (
                <tr key={row.id}>
                  <td>{findProject(row.projectId)?.name}</td>
                  <td>{findVendor(row.vendorId)?.name}</td>
                  <td>{order?.number}</td>
                  <td>{yen(order?.amount ?? 0)}</td>
                  <td>{yen(row.previous)}</td>
                  <td>
                    <input className="amount-input" type="number" value={row.progressAmount} onChange={(event) => update(row.id, "progressAmount", Number(event.target.value))} />
                  </td>
                  <td>
                    <input className="amount-input" type="number" value={row.assessed} onChange={(event) => update(row.id, "assessed", Number(event.target.value))} />
                  </td>
                  <td>
                    <input className="amount-input" type="number" value={row.deduction} onChange={(event) => update(row.id, "deduction", Number(event.target.value))} />
                  </td>
                  <td>{yen(scheduled)}</td>
                  <td>{yen(balance)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{row.comment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
