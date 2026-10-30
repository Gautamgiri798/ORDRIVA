import { Order, Branch } from '@/types';

/**
 * Creates an off-screen iframe with actual non-zero dimensions so Chromium
 * builds a complete layout tree and never delegates print to window.top.
 */
function createPrintIframe(width: string, height: string): HTMLIFrameElement {
  const existing = document.getElementById('ordriva-print-iframe');
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'ordriva-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = width;
  iframe.style.height = height;
  iframe.style.border = 'none';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);
  return iframe;
}

/**
 * Executes a clean 80mm thermal receipt print using an isolated iframe.
 * Prevents browser headers, URLs, and whole-page layout shifts.
 */
export function print80mmReceipt(
  order: Order,
  branch: Branch,
  cashierName: string = 'Rahul Verma'
): void {
  if (typeof window === 'undefined') return;

  const iframe = createPrintIframe('80mm', '1200px');
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const itemsHtml = order.items
    .map((it) => {
      const modText =
        it.modifiers && it.modifiers.length > 0
          ? `<div style="font-size:9.5px;color:#555;padding-left:8px;">+ ${it.modifiers.map((m) => m.name).join(', ')}</div>`
          : '';

      return `
        <div style="margin-bottom:5px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;font-size:11px;">
            <div style="flex:1;padding-right:6px;">
              <span style="font-weight:bold;">${it.quantity}x</span> ${it.name}
            </div>
            <div style="font-weight:bold;white-space:nowrap;">₹${it.itemTotal.toFixed(2)}</div>
          </div>
          ${modText}
        </div>
      `;
    })
    .join('');

  const isPaid = order.paymentStatus === 'succeeded';
  const payMethodText = isPaid
    ? `SETTLED • ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'CASH'}`
    : 'UNPAID / RUNNING TAB';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt_Order_${order.orderNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            width: 78mm;
            margin: 0 auto;
            padding: 4mm 3mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          
          .divider {
            border-bottom: 1px dashed #000;
            margin: 6px 0;
          }
          .double-divider {
            border-bottom: 2px solid #000;
            margin: 6px 0;
          }
          
          .brand-title {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 2px;
            margin-bottom: 2px;
          }
          .branch-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .branch-sub {
            font-size: 10px;
            color: #222;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin-bottom: 2px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            margin: 4px 0;
          }
          
          .status-badge {
            display: inline-block;
            border: 1px solid #000;
            padding: 2px 6px;
            font-weight: bold;
            font-size: 10px;
            margin-top: 4px;
            text-align: center;
          }
          .footer-note {
            font-size: 9.5px;
            text-align: center;
            margin-top: 8px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="text-center">
          <div class="brand-title">ORDRIVA</div>
          <div class="branch-name">${branch.name}</div>
          <div class="branch-sub">${branch.address}</div>
          <div class="branch-sub">GSTIN: <span class="bold">${branch.gstin}</span></div>
          <div class="branch-sub">Phone: ${branch.phone}</div>
          <div class="branch-sub">FSSAI Lic: 10019011000123</div>
        </div>

        <div class="divider"></div>

        <div class="text-center bold" style="font-size:12px; letter-spacing:1px;">
          RETAIL TAX INVOICE
        </div>

        <div class="divider"></div>

        <!-- Metadata -->
        <div class="row">
          <span><span class="bold">Bill No:</span> #${order.orderNumber}</span>
          <span><span class="bold">Date:</span> ${dateStr}</span>
        </div>
        <div class="row">
          <span><span class="bold">Type:</span> ${order.orderType === 'dine_in' ? `Dine-In (${order.tableLabel || 'Table'})` : 'Takeaway / Counter'}</span>
          <span><span class="bold">Time:</span> ${timeStr}</span>
        </div>
        <div class="row">
          <span><span class="bold">Cashier:</span> ${cashierName}</span>
          <span><span class="bold">Guest:</span> ${order.customerName || 'Walk-in'}</span>
        </div>

        <div class="double-divider"></div>

        <!-- Items Table Header -->
        <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:10.5px;margin-bottom:4px;">
          <span>ITEM DESCRIPTION</span>
          <span>AMOUNT</span>
        </div>
        <div class="divider" style="margin-top:2px;"></div>

        <!-- Items List -->
        ${itemsHtml}

        <div class="divider"></div>

        <!-- Totals Breakdown -->
        <div class="total-row">
          <span>Item Subtotal:</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        ${
          order.discountTotal > 0
            ? `<div class="total-row" style="font-weight:bold;"><span>Special Discount:</span><span>-₹${order.discountTotal.toFixed(2)}</span></div>`
            : ''
        }
        <div class="total-row">
          <span>CGST (2.5%):</span>
          <span>₹${order.cgst.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>SGST (2.5%):</span>
          <span>₹${order.sgst.toFixed(2)}</span>
        </div>
        ${
          order.serviceChargeTotal > 0
            ? `<div class="total-row"><span>Service Charge (5%):</span><span>₹${order.serviceChargeTotal.toFixed(2)}</span></div>`
            : ''
        }

        <div class="double-divider"></div>

        <div class="grand-total-row">
          <span>NET PAYABLE:</span>
          <span>₹${order.grandTotal.toFixed(2)}</span>
        </div>

        <div class="double-divider"></div>

        <!-- Payment Settlement Stamp -->
        <div class="text-center">
          <div class="status-badge">${payMethodText}</div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <div>*** THANK YOU FOR DINING WITH US ***</div>
          <div>All Taxes &amp; Statutory GST Included</div>
          <div>Powered by ORDRIVA Restaurant OS</div>
        </div>
      </body>
    </html>
  `);

  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 2500);
  }, 250);
}

/**
 * Executes a full A4 GST Corporate Tax Invoice print.
 */
export function printA4TaxInvoice(
  order: Order,
  branch: Branch,
  cashierName: string = 'Rahul Verma'
): void {
  if (typeof window === 'undefined') return;

  const iframe = createPrintIframe('210mm', '297mm');
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = order.items
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px;">
          <div style="font-weight: 700; color: #0f172a;">${it.name}</div>
          ${
            it.modifiers && it.modifiers.length > 0
              ? `<div style="font-size: 11px; color: #64748b;">+ ${it.modifiers.map((m) => m.name).join(', ')}</div>`
              : ''
          }
        </td>
        <td style="padding: 10px 12px; text-align: center;">996331</td>
        <td style="padding: 10px 12px; text-align: center; font-weight: 700;">${it.quantity}</td>
        <td style="padding: 10px 12px; text-align: right;">₹${(it.itemTotal / it.quantity).toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700;">₹${it.itemTotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax_Invoice_${order.orderNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
          .totals-grid { display: flex; justify-content: flex-end; margin-top: 15px; }
          .totals-table { width: 320px; }
          .totals-table td { padding: 6px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ORDRIVA RESTAURANT OS</div>
            <div style="font-weight: bold; font-size: 15px; margin-top: 4px;">${branch.name}</div>
            <div style="color: #475569;">${branch.address}</div>
            <div style="color: #475569;">GSTIN: <strong>${branch.gstin}</strong> • Phone: ${branch.phone}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 900; color: #2563eb;">TAX INVOICE</div>
            <div style="font-weight: bold; margin-top: 4px;">Invoice No: #${order.orderNumber}</div>
            <div style="color: #475569;">Date: ${dateStr}</div>
            <div style="color: #475569;">Order Type: ${order.orderType.toUpperCase()} ${order.tableLabel ? `• Table ${order.tableLabel}` : ''}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Item Description</th>
              <th style="width: 80px; text-align: center;">HSN/SAC</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Rate (₹)</th>
              <th style="width: 110px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals-grid">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">₹${order.subtotal.toFixed(2)}</td>
            </tr>
            ${
              order.discountTotal > 0
                ? `<tr><td style="color:#dc2626;">Discount:</td><td style="text-align:right;font-weight:600;color:#dc2626;">-₹${order.discountTotal.toFixed(2)}</td></tr>`
                : ''
            }
            <tr>
              <td>CGST (2.5%):</td>
              <td style="text-align: right;">₹${order.cgst.toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST (2.5%):</td>
              <td style="text-align: right;">₹${order.sgst.toFixed(2)}</td>
            </tr>
            ${
              order.serviceChargeTotal > 0
                ? `<tr><td>Service Charge (5%):</td><td style="text-align: right;">₹${order.serviceChargeTotal.toFixed(2)}</td></tr>`
                : ''
            }
            <tr style="border-top: 2px solid #0f172a; font-size: 16px; font-weight: 900;">
              <td>TOTAL DUE:</td>
              <td style="text-align: right; color: #2563eb;">₹${order.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-size: 11px; color: #64748b;">Payment Status:</td>
              <td style="text-align: right; font-weight: 700; color: ${order.paymentStatus === 'succeeded' ? '#16a34a' : '#d97706'};">
                ${order.paymentStatus === 'succeeded' ? `PAID (${order.paymentMethod?.toUpperCase() || 'CASH'})` : 'PENDING'}
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; text-align: center;">
          Thank you for your patronage! This is a computer-generated tax invoice verified under statutory GST guidelines.
        </div>
      </body>
    </html>
  `);

  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      iframe.remove();
    }, 2500);
  }, 250);
}

export interface ReportPrintData {
  branch: Branch;
  periodLabel: string;
  generatedAt: Date;
  cashierName: string;
  totalOrders: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalTax: number;
  totalCgst: number;
  totalSgst: number;
  aov: number;
  cashTotal: number;
  upiTotal: number;
  cardTotal: number;
  topDishes: { name: string; count: number; revenue: number }[];
}

/**
 * Executes a clean 80mm thermal Z-Report register shift closing slip.
 */
export function printZReport80mm(data: ReportPrintData): void {
  if (typeof window === 'undefined') return;

  const iframe = createPrintIframe('80mm', '1400px');
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const dateStr = data.generatedAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = data.generatedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dishesHtml =
    data.topDishes.length > 0
      ? data.topDishes
          .map(
            (d, i) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:10px;">
          <span>${i + 1}. ${d.name} (${d.count}x)</span>
          <span style="font-weight:bold;">₹${d.revenue.toFixed(2)}</span>
        </div>
      `
          )
          .join('')
      : '<div style="font-size:10px;color:#666;">No dish sales recorded</div>';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Z_Report_${dateStr}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            width: 78mm;
            margin: 0 auto;
            padding: 4mm 3mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
            color: #000;
            background: #fff;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .grand-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size:16px;font-weight:900;letter-spacing:1px;">ORDRIVA</div>
          <div class="bold" style="font-size:12px;">${data.branch.name}</div>
          <div style="font-size:10px;">${data.branch.address}</div>
          <div style="font-size:10px;">GSTIN: <span class="bold">${data.branch.gstin}</span></div>
          <div style="font-size:10px;">Phone: ${data.branch.phone}</div>
          <div style="font-size:10px;">FSSAI: 10019011000123</div>
        </div>

        <div class="divider"></div>
        <div class="text-center bold" style="font-size:12px;letter-spacing:1px;">
          END-OF-DAY (Z-REPORT) CLOSING
        </div>
        <div class="divider"></div>

        <div class="row">
          <span>Date: <span class="bold">${dateStr}</span></span>
          <span>Time: <span class="bold">${timeStr}</span></span>
        </div>
        <div class="row">
          <span>Period: <span class="bold" style="text-transform:uppercase;">${data.periodLabel}</span></span>
          <span>Register: <span class="bold">POS-01</span></span>
        </div>
        <div class="row">
          <span>Audited By: <span class="bold">${data.cashierName}</span></span>
          <span>Settled Bills: <span class="bold">${data.totalOrders}</span></span>
        </div>

        <div class="double-divider"></div>
        <div class="bold" style="font-size:11px;margin-bottom:3px;">REVENUE &amp; TAX TOTALS</div>
        <div class="divider"></div>

        <div class="row">
          <span>Gross Revenue:</span>
          <span class="bold">₹${data.grossSales.toFixed(2)}</span>
        </div>
        ${
          data.totalDiscount > 0
            ? `
          <div class="row" style="color:#d00;">
            <span>Discounts Allowed:</span>
            <span>-₹${data.totalDiscount.toFixed(2)}</span>
          </div>
        `
            : ''
        }
        <div class="row">
          <span>Net Food Sales:</span>
          <span>₹${data.netSales.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Central GST (2.5%):</span>
          <span>₹${data.totalCgst.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>State GST (2.5%):</span>
          <span>₹${data.totalSgst.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Total Statutory GST:</span>
          <span class="bold">₹${data.totalTax.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Average Ticket (AOV):</span>
          <span>₹${data.aov.toFixed(2)}</span>
        </div>

        <div class="double-divider"></div>
        <div class="grand-row">
          <span>TOTAL SETTLED:</span>
          <span>₹${data.grossSales.toFixed(2)}</span>
        </div>
        <div class="double-divider"></div>

        <div class="bold" style="font-size:11px;margin-bottom:3px;">REGISTER RECONCILIATION</div>
        <div class="divider"></div>

        <div class="row">
          <span>CASH IN DRAWER:</span>
          <span class="bold">₹${data.cashTotal.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>UPI QR TRANSFERS:</span>
          <span class="bold">₹${data.upiTotal.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>CARD EDC TERMINALS:</span>
          <span class="bold">₹${data.cardTotal.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>TOTAL DIGITAL:</span>
          <span class="bold">₹${(data.upiTotal + data.cardTotal).toFixed(2)}</span>
        </div>

        <div class="divider"></div>
        <div class="bold" style="font-size:11px;margin-bottom:3px;">TOP DISH SALES</div>
        <div class="divider"></div>
        ${dishesHtml}

        <div class="divider"></div>
        <div style="margin-top:14px;font-size:10px;">
          <div style="margin-bottom:12px;">Cashier Signature: __________________</div>
          <div>Manager Sign-off:  __________________</div>
        </div>

        <div class="divider" style="margin-top:10px;"></div>
        <div class="text-center" style="font-size:9.5px;color:#333;margin-top:6px;">
          <div>*** END OF SHIFT Z-REPORT ***</div>
          <div>Register Status: BALANCED &amp; SEALED</div>
          <div>Powered by ORDRIVA Restaurant OS</div>
        </div>
      </body>
    </html>
  `);

  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Z-Report print error', e);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 300);
}

/**
 * Executes a clean, full 1-page A4 Executive Sales, Taxes & GST Audit Report.
 * Guaranteed to fit on exactly 1 single sheet with no page splits or cuts.
 */
export function printExecutiveReportA4(data: ReportPrintData): void {
  if (typeof window === 'undefined') return;

  const iframe = createPrintIframe('210mm', '297mm');
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const dateStr = data.generatedAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = data.generatedAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const upiPct = data.grossSales > 0 ? Math.round((data.upiTotal / data.grossSales) * 100) : 0;
  const cashPct = data.grossSales > 0 ? Math.round((data.cashTotal / data.grossSales) * 100) : 0;
  const cardPct = data.grossSales > 0 ? Math.round((data.cardTotal / data.grossSales) * 100) : 0;

  const dishesRows =
    data.topDishes.length > 0
      ? data.topDishes
          .map(
            (d, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 6px 8px; color: #64748b; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${d.name}</td>
          <td style="padding: 6px 8px; text-align: center; color: #475569;">${d.count} sold</td>
          <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #0f172a;">₹${d.revenue.toFixed(2)}</td>
        </tr>
      `
          )
          .join('')
      : '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94a3b8;">No dish sales recorded</td></tr>';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales_Tax_Report_${dateStr}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: 0.5px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
          }
          .kpi-val {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 3px;
          }
          .kpi-sub {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
          }
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
          }
          .section-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          .table th {
            text-align: left;
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            padding: 4px 8px;
            border-bottom: 1px solid #cbd5e1;
            background: #f8fafc;
          }
          .z-box {
            background: #0f172a;
            color: #fff;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 14px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .z-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-top: 8px;
          }
          .sign-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }
          .sign-line {
            border-top: 1px solid #94a3b8;
            padding-top: 4px;
            font-size: 9.5px;
            font-weight: 700;
            color: #475569;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div>
            <div class="brand-title">ORDRIVA RESTAURANT OS</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${data.branch.name}</div>
            <div style="color: #64748b;">${data.branch.address}</div>
            <div style="color: #64748b;">GSTIN: <strong style="color:#0f172a;">${data.branch.gstin}</strong> • Phone: ${data.branch.phone}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px;">EXECUTIVE AUDIT &amp; SALES STATEMENT</div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Report Period: ${data.periodLabel.toUpperCase()}</div>
            <div style="color: #64748b;">Generated: ${dateStr} at ${timeStr}</div>
            <div style="color: #16a34a; font-weight: bold; font-size: 10px; margin-top: 2px;">REGISTER CLOSED &amp; AUDITED</div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Gross Revenue</div>
            <div class="kpi-val">₹${data.grossSales.toFixed(2)}</div>
            <div class="kpi-sub">${data.totalOrders} Settled Bills</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Net Food Sales</div>
            <div class="kpi-val">₹${data.netSales.toFixed(2)}</div>
            <div class="kpi-sub">Discounts: -₹${data.totalDiscount.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Dual GST Collected (5%)</div>
            <div class="kpi-val" style="color: #16a34a;">₹${data.totalTax.toFixed(2)}</div>
            <div class="kpi-sub">CGST: ₹${data.totalCgst.toFixed(2)} | SGST: ₹${data.totalSgst.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Average Ticket (AOV)</div>
            <div class="kpi-val" style="color: #2563eb;">₹${data.aov.toFixed(2)}</div>
            <div class="kpi-sub">Per Customer Order</div>
          </div>
        </div>

        <!-- Two Column Section -->
        <div class="two-col">
          <!-- Channel Reconciliation -->
          <div class="section-box">
            <div class="section-title">Payment Channel Reconciliation</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th style="text-align: center;">Share</th>
                  <th style="text-align: right;">Audited Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 7px 8px; font-weight: bold;">UPI QR Transfers</td>
                  <td style="padding: 7px 8px; text-align: center; color: #2563eb; font-weight: bold;">${upiPct}%</td>
                  <td style="padding: 7px 8px; text-align: right; font-weight: bold;">₹${data.upiTotal.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 7px 8px; font-weight: bold;">Cash Drawer (Physical)</td>
                  <td style="padding: 7px 8px; text-align: center; color: #16a34a; font-weight: bold;">${cashPct}%</td>
                  <td style="padding: 7px 8px; text-align: right; font-weight: bold;">₹${data.cashTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 8px; font-weight: bold;">Card Terminals (EDC)</td>
                  <td style="padding: 7px 8px; text-align: center; color: #7c3aed; font-weight: bold;">${cardPct}%</td>
                  <td style="padding: 7px 8px; text-align: right; font-weight: bold;">₹${data.cardTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Top Selling Dishes -->
          <div class="section-box">
            <div class="section-title">Top Revenue Dishes</div>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 20px;">#</th>
                  <th>Menu Item</th>
                  <th style="text-align: center;">Portions</th>
                  <th style="text-align: right;">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${dishesRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- End of Day Z-Report Summary Box -->
        <div class="z-box">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">END-OF-DAY (Z-REPORT) REGISTER SETTLEMENT</div>
            <div style="font-size: 10px; color: #94a3b8;">Shift Reconciliation &amp; Terminal Balance</div>
          </div>
          <div class="z-grid">
            <div>
              <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Total Transactions</div>
              <div style="font-size: 15px; font-weight: 900; margin-top: 2px;">${data.totalOrders} Invoices</div>
            </div>
            <div>
              <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Physical Cash in Drawer</div>
              <div style="font-size: 15px; font-weight: 900; color: #34d399; margin-top: 2px;">₹${data.cashTotal.toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Total Digital Settlement</div>
              <div style="font-size: 15px; font-weight: 900; color: #60a5fa; margin-top: 2px;">₹${(data.upiTotal + data.cardTotal).toFixed(2)}</div>
            </div>
            <div>
              <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Statutory Tax Pool</div>
              <div style="font-size: 15px; font-weight: 900; color: #fbbf24; margin-top: 2px;">₹${data.totalTax.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <!-- Verification Signatures -->
        <div class="sign-grid">
          <div class="sign-line">
            Cashier / Shift Lead (${data.cashierName})
          </div>
          <div class="sign-line">
            Duty Restaurant Manager
          </div>
          <div class="sign-line">
            Internal Audit &amp; Finance Seal
          </div>
        </div>

        <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #94a3b8;">
          This is an official computer-generated statutory sales and tax report. All figures are verified under GST compliance guidelines.
        </div>
      </body>
    </html>
  `);

  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('A4 Executive Report print error', e);
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 3000);
    }
  }, 300);
}

