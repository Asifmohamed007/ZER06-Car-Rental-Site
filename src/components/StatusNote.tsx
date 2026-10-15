export function StatusNote({ tone = "info", title, children }: { tone?: "info" | "error" | "success" | "warn"; title: string; children?: React.ReactNode }) {
  const ring = { info: "ring-cream/20", error: "ring-bad/50", success: "ring-ok/50", warn: "ring-warn/50" }[tone];
  const dot = { info: "bg-cream", error: "bg-bad", success: "bg-ok", warn: "bg-warn" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`cut cut-sm bg-navy-800/70 p-5 ring-1 ring-inset ${ring}`}>
      <p className="flex items-center gap-2.5 font-medium"><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />{title}</p>
      {children && <div className="mt-2 text-cream/75">{children}</div>}
    </div>
  );
}
