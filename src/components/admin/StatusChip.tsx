import { statusLabels } from "@/lib/format";
const tone: Record<string, string> = { pending: "bg-warn/15 text-warn", confirmed: "bg-ok/15 text-ok", cancelled: "bg-bad/15 text-bad", completed: "bg-cream/10 text-cream/70" };
export const StatusChip = ({ status }: { status: string }) => <span className={`chip ${tone[status] ?? ""}`}>{statusLabels[status] ?? status}</span>;
