import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { PERF_WEIGHTS, scoreBoard } from "@/lib/perfDerivations";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

async function scores(payload) {
  const res = await base44.functions.invoke("scores", payload);
  return res?.data ?? res;
}

export default function PerfScoreBoard({ lang }) {
  const { company, data } = useAuth();
  const ar = lang === "ar";
  const [board, setBoard] = useState([]);
  const [source, setSource] = useState("local");

  useEffect(() => {
    if (!data?.employees) return;
    const localRows = data.employees.map((e) => ({
      employeeId: e.id,
      name: e.name,
      pts: e.points || 0,
      ontimePct: 80,
      closure: 0,
      reportPts: 0,
      coverPts: 0,
    }));
    setBoard(scoreBoard(localRows).slice(0, 12));
    setSource("local");
    if (!company?.id) return;
    scores({ action: "perfBoard", companyId: company.id })
      .then((remote) => {
        if (Array.isArray(remote?.board) && remote.board.length) {
          setBoard(remote.board.slice(0, 12));
          setSource("server");
        }
      })
      .catch(() => {});
  }, [company?.id, data?.employees]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
      <div>
        <h3 className="font-heading font-semibold">
          {ar ? "درجة الأداء (صيغة ثابتة)" : "Performance score (fixed formula)"}
        </h3>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {ar
            ? `نقاط المهام ${Math.round(PERF_WEIGHTS.pts * 100)}% · الالتزام ${Math.round(PERF_WEIGHTS.ontime * 100)}% · السلامة ${Math.round(PERF_WEIGHTS.hse * 100)}% · تغطية الورديات ${Math.round(PERF_WEIGHTS.cover * 100)}% — الحضور ليس بندًا.`
            : `Task points ${Math.round(PERF_WEIGHTS.pts * 100)}% · On-time ${Math.round(PERF_WEIGHTS.ontime * 100)}% · Safety ${Math.round(PERF_WEIGHTS.hse * 100)}% · Shift coverage ${Math.round(PERF_WEIGHTS.cover * 100)}% — attendance is not a term.`}
          <span className="ms-2 opacity-60">({source})</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-start py-2 pe-2">#</th>
              <th className="text-start py-2 pe-2">{ar ? "الموظف" : "Employee"}</th>
              <th className="text-start py-2 pe-2">{ar ? "الدرجة" : "Score"}</th>
              <th className="text-start py-2 pe-2">{ar ? "نقاط" : "Pts"}</th>
              <th className="text-start py-2">{ar ? "حماية انتقالية" : "Guard"}</th>
            </tr>
          </thead>
          <tbody>
            {board.map((row) => (
              <tr key={row.employeeId} className="border-b border-border/50">
                <td className="py-2 pe-2 text-muted-foreground">{row.rank}</td>
                <td className="py-2 pe-2 font-medium">
                  <EmployeeNameLink employeeId={row.employeeId} employeeName={row.name} />
                </td>
                <td className="py-2 pe-2 font-heading font-semibold">{row.score}</td>
                <td className="py-2 pe-2 text-muted-foreground">{row.pts}</td>
                <td className="py-2 text-xs text-muted-foreground">
                  {row.protectedBy ? (ar ? `أعلى السابق ${row.oldScore}` : `Prior ${row.oldScore}`) : "—"}
                </td>
              </tr>
            ))}
            {!board.length && (
              <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">{ar ? "لا بيانات بعد" : "No scores yet"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
