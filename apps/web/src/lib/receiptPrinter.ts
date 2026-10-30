import { Order, Branch } from '@/types';

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

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

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

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

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

