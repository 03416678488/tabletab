import { formatMoney } from "@/lib/currency";

interface ReceiptLine {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  orderNumber: string;
  /** Business name printed as the receipt header (from Business Info). */
  businessName?: string;
  /** Branding logo (uploaded data URI or URL) printed above the name. */
  logoUrl?: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  tax?: number;
  taxLabel?: string;
  total: number;
  paymentNote: string;
}

/** Opens a print-friendly receipt in a new window and triggers the print dialog. */
export function printReceipt(data: ReceiptData) {
  const rows = data.lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.name)}</td><td style="text-align:center">${l.qty}</td><td style="text-align:right">${formatMoney(l.price)}</td></tr>`,
    )
    .join("");

  const taxRow =
    data.tax && data.tax > 0
      ? `<tr><td colspan="2">Tax${data.taxLabel ? ` (${escapeHtml(data.taxLabel)})` : ""}</td><td style="text-align:right">${formatMoney(data.tax)}</td></tr>`
      : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    data.orderNumber,
  )}</title><style>
    *{font-family:ui-monospace,monospace;font-size:12px;color:#111}
    body{width:280px;margin:0 auto;padding:12px}
    h1{font-size:16px;text-align:center;margin:0 0 2px}
    .logo{display:block;max-width:160px;max-height:80px;margin:0 auto 6px;object-fit:contain}
    .muted{color:#666;text-align:center;margin:0 0 10px}
    table{width:100%;border-collapse:collapse}
    td,th{padding:3px 0}
    thead th{border-bottom:1px dashed #999;text-align:left;font-size:11px}
    tfoot td{padding-top:4px}
    .tot{border-top:1px dashed #999;font-weight:bold}
    .pay{margin-top:10px;border-top:1px dashed #999;padding-top:8px;text-align:center}
  </style></head><body>
    ${
      data.logoUrl
        ? `<img class="logo" src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(
            data.businessName?.trim() || "Logo",
          )}">`
        : ""
    }
    <h1>${escapeHtml(data.businessName?.trim() || "Receipt")}</h1>
    <p class="muted">Order ${escapeHtml(data.orderNumber)}<br>${new Date().toLocaleString()}</p>
    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="2">Sub Total</td><td style="text-align:right">${formatMoney(data.subtotal)}</td></tr>
        <tr><td colspan="2">Discount</td><td style="text-align:right">${formatMoney(data.discount)}</td></tr>
        ${taxRow}
        <tr class="tot"><td colspan="2">Total</td><td style="text-align:right">${formatMoney(data.total)}</td></tr>
      </tfoot>
    </table>
    <p class="pay">${escapeHtml(data.paymentNote)}</p>
    <p class="muted" style="margin-top:10px">Thank you!</p>
  </body></html>`;

  const w = window.open("", "_blank", "width=340,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();

  // Print once the logo has loaded so it isn't missing from the printout.
  // Data-URI logos are usually ready immediately; a URL logo may not be, so we
  // wait for onload/onerror with a short timeout fallback.
  const doPrint = () => w.print();
  const img = data.logoUrl
    ? (w.document.querySelector("img.logo") as HTMLImageElement | null)
    : null;
  if (img && !img.complete) {
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      doPrint();
    };
    img.onload = once;
    img.onerror = once;
    w.setTimeout(once, 1000);
  } else {
    doPrint();
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
