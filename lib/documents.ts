// Shared types + helpers for the document system (Quotation / ICV / Invoice).

export type LineItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  // invoice-only fields
  refNum?: string;
  amtPaid?: number;
  expense?: number;
};

export type DocMeta = {
  docType?: "quotation" | "icv" | "invoice";
  clientName?: string;
  company?: string;
  address?: string;
  contact?: string;
  clientRefId?: string;
  subject?: string;
  referenceNo?: string;
  customerId?: string;
  purpose?: string;
  [k: string]: unknown;
};

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Coerce incoming rows to clean numbers; derive amount from qty×unitPrice when
// not explicitly provided (quotation/ICV), keep provided amount otherwise.
export function normalizeItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r): LineItem => {
      const o = (r ?? {}) as Record<string, unknown>;
      const quantity = num(o.quantity ?? 1) || 1;
      const unitPrice = num(o.unitPrice);
      const amount = o.amount != null ? num(o.amount) : quantity * unitPrice;
      const item: LineItem = { description: String(o.description ?? "").trim(), quantity, unitPrice, amount };
      if (o.refNum != null) item.refNum = String(o.refNum);
      if (o.amtPaid != null) item.amtPaid = num(o.amtPaid);
      if (o.expense != null) item.expense = num(o.expense);
      return item;
    })
    .filter((i) => i.description || i.amount);
}

export const sumAmount = (items: LineItem[]): number => items.reduce((s, i) => s + num(i.amount), 0);
export const sumPaid = (items: LineItem[]): number => items.reduce((s, i) => s + num(i.amtPaid), 0);

// Snapshot a Client row into the document meta (freezes details at issue time).
export function clientSnapshot(c: { name?: string; company?: string; address?: string; phone?: string } | null | undefined): DocMeta {
  return {
    clientName: c?.name ?? "",
    company: c?.company ?? "",
    address: c?.address ?? "Abu Dhabi, UAE",
    contact: c?.phone ?? "",
  };
}
