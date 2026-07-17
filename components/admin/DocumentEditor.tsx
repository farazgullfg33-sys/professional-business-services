"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export type DocType = "quotation" | "icv" | "invoice";
type ClientLite = { id: string; name: string; company?: string };
type Item = { description: string; quantity: number; unitPrice: number; amount: number; refNum?: string; amtPaid?: number; expense?: number };

const inputClass = "rounded-md border border-edge bg-base px-3 py-2 text-sm text-heading placeholder:text-muted focus:border-gold focus:outline-none";
const cellClass = "rounded border border-edge bg-base px-2 py-1.5 text-sm text-heading focus:border-gold focus:outline-none w-full";

const TITLES: Record<DocType, string> = { quotation: "Quotation", icv: "ICV & ADNOC Quotation", invoice: "Tax Invoice" };

const money = (n: number) => `AED ${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const emptyItem = (): Item => ({ description: "", quantity: 1, unitPrice: 0, amount: 0, refNum: "", amtPaid: 0, expense: 0 });

export function DocumentEditor({
  docType, clients, record, onClose, onSaved,
}: {
  docType: DocType;
  clients: ClientLite[];
  record?: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isInvoice = docType === "invoice";
  const editing = Boolean(record?.id);
  const meta = record?.meta ?? {};

  const [clientId, setClientId] = useState<string>(record?.clientId ?? "");
  const [subject, setSubject] = useState<string>(meta.subject ?? (docType === "icv" ? "ICV & ADNOC Pre-Qualification" : ""));
  const [purpose, setPurpose] = useState<string>(meta.purpose ?? "");
  const [refId, setRefId] = useState<string>(meta.clientRefId ?? meta.customerId ?? "");
  const [referenceNo, setReferenceNo] = useState<string>(meta.referenceNo ?? "");
  const [status, setStatus] = useState<string>(record?.status ?? (isInvoice ? "pending" : "draft"));
  const [paymentMethod, setPaymentMethod] = useState<string>(record?.paymentMethod ?? "Bank Transfer");
  const [items, setItems] = useState<Item[]>(() => {
    const raw = record?.lineItems;
    if (Array.isArray(raw) && raw.length) return raw.map((r: any) => ({ ...emptyItem(), ...r }));
    return [emptyItem()];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, idx) => {
      if (idx !== i) return it;
      const next = { ...it, ...patch };
      next.amount = isInvoice ? Number(next.amount) || 0 : (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0);
      return next;
    }));
  };
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (i: number) => setItems((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const totals = useMemo(() => {
    const quote = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const paid = items.reduce((s, i) => s + (Number(i.amtPaid) || 0), 0);
    const expense = items.reduce((s, i) => s + (Number(i.expense) || 0), 0);
    return { quote, paid, expense, balance: quote - paid };
  }, [items]);

  const submit = async () => {
    setError("");
    if (!clientId) { setError("Select a client."); return; }
    const cleanItems = items.filter((i) => i.description.trim() || i.amount);
    if (cleanItems.length === 0) { setError("Add at least one line item."); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { lineItems: cleanItems, referenceNo };
      if (isInvoice) {
        Object.assign(payload, { clientId, purpose, customerId: refId, status, paymentMethod });
      } else {
        Object.assign(payload, { clientId, docType, subject, clientRefId: refId });
      }
      const base = isInvoice ? "/api/admin/invoice" : "/api/admin/quote";
      const url = editing ? `${base}/${record.id}` : `${base}/create`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Error ${res.status}`); }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
          className="glass-panel my-6 w-full max-w-3xl rounded-lg p-6 shadow-soft"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-heading">{editing ? "Edit" : "New"} {TITLES[docType]}</h3>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md border border-edge text-muted hover:text-heading"><X size={16} /></button>
          </div>

          {/* Client + header fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Client *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={cn(inputClass, "mt-1 w-full")}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Reference #</label>
              <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Auto (QUO-MM-YYYY)" className={cn(inputClass, "mt-1 w-full")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">{isInvoice ? "Purpose" : "Subject"}</label>
              <input value={isInvoice ? purpose : subject} onChange={(e) => (isInvoice ? setPurpose : setSubject)(e.target.value)} placeholder={isInvoice ? "Purpose of invoice" : "Subject of quotation"} className={cn(inputClass, "mt-1 w-full")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">{isInvoice ? "Customer ID" : "Client's ID"}</label>
              <input value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="-" className={cn(inputClass, "mt-1 w-full")} />
            </div>
            {isInvoice && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn(inputClass, "mt-1 w-full")}>
                    {["pending", "paid", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={cn(inputClass, "mt-1 w-full")}>
                    {["Bank Transfer", "Cash", "Card", "Cheque"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Line items */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-heading text-sm font-semibold text-heading">Line Items</h4>
              <button onClick={addItem} className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold hover:bg-gold/20"><Plus size={13} /> Add Row</button>
            </div>

            <div className="overflow-x-auto rounded-md border border-edge">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-panel text-muted">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase">Description</th>
                    {isInvoice ? (
                      <>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Ref</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Amt Quote</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Amt Paid</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Expence</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Balance</th>
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Unit Price</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase">Amount</th>
                      </>
                    )}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5"><input value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Service / item" className={cellClass} /></td>
                      {isInvoice ? (
                        <>
                          <td className="px-2 py-1.5 w-[70px]"><input value={it.refNum ?? ""} onChange={(e) => updateItem(i, { refNum: e.target.value })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 w-[92px]"><input type="number" step="0.01" value={it.amount || ""} onChange={(e) => updateItem(i, { amount: Number(e.target.value) })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 w-[92px]"><input type="number" step="0.01" value={it.amtPaid || ""} onChange={(e) => updateItem(i, { amtPaid: Number(e.target.value) })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 w-[92px]"><input type="number" step="0.01" value={it.expense || ""} onChange={(e) => updateItem(i, { expense: Number(e.target.value) })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 text-right font-medium text-heading">{((Number(it.amount) || 0) - (Number(it.amtPaid) || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-1.5 w-[70px]"><input type="number" step="1" value={it.quantity || ""} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 w-[110px]"><input type="number" step="0.01" value={it.unitPrice || ""} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className={cn(cellClass, "text-right")} /></td>
                          <td className="px-2 py-1.5 text-right font-medium text-heading">{(Number(it.amount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </>
                      )}
                      <td className="px-1 text-center"><button onClick={() => removeItem(i)} className="text-muted hover:text-red-400" aria-label="Remove row"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 flex flex-col items-end gap-1 text-sm">
              {isInvoice ? (
                <>
                  <div className="flex w-full max-w-xs justify-between text-muted"><span>Total Quoted</span><span>{money(totals.quote)}</span></div>
                  <div className="flex w-full max-w-xs justify-between text-muted"><span>Total Paid</span><span>{money(totals.paid)}</span></div>
                  <div className="flex w-full max-w-xs justify-between rounded bg-gold/15 px-2 py-1 font-bold text-heading"><span>Balance Due</span><span>{money(totals.balance)}</span></div>
                </>
              ) : (
                <div className="flex w-full max-w-xs justify-between rounded bg-gold/15 px-2 py-1 font-bold text-heading"><span>TOTAL</span><span>{money(totals.quote)}</span></div>
              )}
            </div>
          </div>

          {error && <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-md border border-edge px-4 py-2 text-sm font-medium text-muted hover:text-heading">Cancel</button>
            <Button onClick={submit} disabled={saving}>{saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : editing ? "Save Changes" : "Create Document"}</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
