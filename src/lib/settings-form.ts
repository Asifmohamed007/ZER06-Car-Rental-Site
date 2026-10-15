/** Converts list-type settings to and from simple editable text, used by the admin settings form. */

const lines = (t: string) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const blocks = (t: string) => t.split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);

export function parsePairs(text: string): { label: string; value: string }[] {
  return lines(text).map((l) => {
    const [label, ...rest] = l.split("|");
    return { label: label.trim(), value: rest.join("|").trim() };
  });
}
export const formatPairs = (items: { label: string; value: string }[]) => items.map((i) => `${i.label} | ${i.value}`).join("\n");

export function parseLocations(text: string): { id: string; name: string; fee: number }[] {
  return lines(text).map((l) => {
    const [id, name, fee] = l.split("|").map((x) => x.trim());
    return { id: (id ?? "").toLowerCase(), name: name ?? "", fee: Number(fee || 0) };
  });
}
export const formatLocations = (items: { id: string; name: string; fee: number }[]) => items.map((i) => `${i.id} | ${i.name} | ${i.fee}`).join("\n");

/** Blocks separated by a blank line. First line is the heading, the rest is the body. */
export function parseBlocks(text: string): { head: string; body: string }[] {
  return blocks(text).map((b) => {
    const [head, ...rest] = b.split(/\r?\n/);
    return { head: head.trim(), body: rest.join("\n").trim() };
  });
}
export const formatBlocks = (items: { head: string; body: string }[]) => items.map((i) => `${i.head}\n${i.body}`).join("\n\n");
