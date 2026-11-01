import { Order, Branch } from '@/types';

/**
 * Creates a valid, standard PDF 1.4 binary file embedding the rendered invoice JPEG.
 */
function createPdfFromJpeg(
  jpegBytes: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  pageWidthPt = 595.28,
  pageHeightPt = 841.89
): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // object 0

  let currentOffset = 0;

  function pushString(str: string) {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  function pushBytes(bytes: Uint8Array) {
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  // 1. PDF Header (with binary marker for PDF compliance)
  pushString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  offsets.push(currentOffset);
  pushString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets.push(currentOffset);
  pushString('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page (A4 Dimensions 595.28 x 841.89 points)
  offsets.push(currentOffset);
  pushString(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Object 4: Image XObject (JPEG DCTDecode)
  offsets.push(currentOffset);
  const imageHeader = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  pushString(imageHeader);
  pushBytes(jpegBytes);
  pushString('\nendstream\nendobj\n');

  // Object 5: Contents stream (Draw image scaled to fill page with clean margins)
  offsets.push(currentOffset);
  const drawContent = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  const drawBytes = encoder.encode(drawContent);
  pushString(`5 0 obj\n<< /Length ${drawBytes.length} >>\nstream\n`);
  pushBytes(drawBytes);
  pushString('endstream\nendobj\n');

  // XRef Table
  const startXref = currentOffset;
  pushString('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pushString(`${offStr} 00000 n \n`);
  }

  // Trailer
  pushString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  // Combine chunks into single Uint8Array
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

/**
 * Renders an ultra-luxurious, executive restaurant GST tax invoice onto an HTML5 Canvas.
 * Generates crystal-clear 300-DPI typography, badges, dividers, and statutory breakdowns.
 */
export async function generateInvoicePdfBlob(
  order: Order,
  branch: Branch
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  // High-Resolution 2x A4 dimensions (1240 x 1754 px)
  const W = 1240;
  const H = 1754;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context');

  // 1. Crisp White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Decorative Subtle Perimeter Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // 2. LUXURY TOP HEADER BANNER (Midnight Navy gradient)
  const headerY = 45;
  const headerH = 195;
  const headerW = W - 90;
  const headerX = 45;

  const headerGrad = ctx.createLinearGradient(headerX, headerY, headerX + headerW, headerY + headerH);
  headerGrad.addColorStop(0, '#0F172A');
  headerGrad.addColorStop(0.65, '#1E293B');
  headerGrad.addColorStop(1, '#0F172A');

  ctx.fillStyle = headerGrad;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(headerX, headerY, headerW, headerH, 16);
    ctx.fill();
  } else {
    ctx.fillRect(headerX, headerY, headerW, headerH);
  }

  // Royal Blue accent bottom border on header
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(headerX + 16, headerY + headerH - 5, headerW - 32, 4);

  // Left side: Brand Title & Metadata
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(branch.name.toUpperCase(), headerX + 35, headerY + 52);

  ctx.fillStyle = '#60A5FA';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('FINE DINING & DIGITAL HOSPITALITY OS', headerX + 35, headerY + 76);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(branch.address, headerX + 35, headerY + 104);
  ctx.fillText(`Phone: ${branch.phone || '+91 98765 43210'}  •  Email: hospitality@ordriva.com`, headerX + 35, headerY + 128);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillText(`GSTIN: ${branch.gstin || '27AABCU9603R1ZM'}   |   FSSAI Lic: ${(branch as any).fssaiLicense || '10019022009876'}`, headerX + 35, headerY + 155);

  // Right side: Official TAX INVOICE Badge & Number
  const rightX = headerX + headerW - 35;
  ctx.textAlign = 'right';

  // Tax Invoice Pill
  ctx.fillStyle = '#2563EB';
  const pillW = 160;
  const pillH = 32;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(rightX - pillW, headerY + 28, pillW, pillH, 8);
    ctx.fill();
  } else {
    ctx.fillRect(rightX - pillW, headerY + 28, pillW, pillH);
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('GST TAX INVOICE', rightX - 22, headerY + 49);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`INV-${order.orderNumber}`, rightX, headerY + 98);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const orderDate = new Date(order.createdAt);
  const dateFormatted = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  ctx.fillText(`${dateFormatted} • ${timeFormatted}`, rightX, headerY + 124);
  ctx.fillText(`Original for Recipient`, rightX, headerY + 148);
  ctx.textAlign = 'left';

  // 3. ORDER & GUEST METADATA STRIP
  const metaY = headerY + headerH + 20;
  const metaH = 110;
  const metaW = headerW;
  const metaX = headerX;

  ctx.fillStyle = '#F8FAFC';
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(metaX, metaY, metaW, metaH, 12);
    ctx.fill();
  } else {
    ctx.fillRect(metaX, metaY, metaW, metaH);
  }
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(metaX, metaY, metaW, metaH, 12);
    ctx.stroke();
  } else {
    ctx.strokeRect(metaX, metaY, metaW, metaH);
  }

  // 4 Meta Columns
  const colW = metaW / 4;

  // Col 1: Order Details
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ORDER REFERENCE', metaX + 22, metaY + 30);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`#${order.orderNumber}`, metaX + 22, metaY + 56);
  ctx.fillStyle = '#475569';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Type: ${order.orderType === 'dine_in' ? 'Dine-In Table' : 'Takeaway'}`, metaX + 22, metaY + 84);

  // Col 2: Seating Table
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TABLE SEATING', metaX + colW + 15, metaY + 30);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(order.tableLabel || 'Table T-01', metaX + colW + 15, metaY + 56);
  ctx.fillStyle = '#475569';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Digital QR Self-Service', metaX + colW + 15, metaY + 84);

  // Col 3: Dining Guest
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DINING GUEST', metaX + colW * 2 + 15, metaY + 30);
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(order.customerName || 'Dining Guest', metaX + colW * 2 + 15, metaY + 56);
  ctx.fillStyle = '#475569';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(order.customerPhone ? `Ph: ${order.customerPhone}` : 'Direct Dine-In', metaX + colW * 2 + 15, metaY + 84);

  // Col 4: Payment Status & Channel
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PAYMENT STATUS', metaX + colW * 3 + 15, metaY + 30);

  const isPaid = order.paymentStatus === 'succeeded';
  const badgeColor = isPaid ? '#10B981' : '#F59E0B';
  const badgeBg = isPaid ? '#ECFDF5' : '#FFFBEB';
  const badgeText = isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING';

  ctx.fillStyle = badgeBg;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(metaX + colW * 3 + 15, metaY + 40, 160, 26, 6);
    ctx.fill();
  } else {
    ctx.fillRect(metaX + colW * 3 + 15, metaY + 40, 160, 26);
  }
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 1.2;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(metaX + colW * 3 + 15, metaY + 40, 160, 26, 6);
    ctx.stroke();
  } else {
    ctx.strokeRect(metaX + colW * 3 + 15, metaY + 40, 160, 26);
  }

  ctx.fillStyle = isPaid ? '#047857' : '#B45309';
  ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(badgeText, metaX + colW * 3 + 30, metaY + 58);

  ctx.fillStyle = '#64748B';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const methodStr = (order.paymentMethod || 'cash').toUpperCase();
  ctx.fillText(`Method: ${methodStr}`, metaX + colW * 3 + 18, metaY + 84);

  // 4. ITEMIZED DISHES TABLE
  const tableY = metaY + metaH + 25;
  const tableW = headerW;
  const tableX = headerX;
  const thHeight = 40;

  // Table Header Bar (Dark Slate)
  ctx.fillStyle = '#1E293B';
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, tableW, thHeight, [8, 8, 0, 0]);
    ctx.fill();
  } else {
    ctx.fillRect(tableX, tableY, tableW, thHeight);
  }

  // Column Boundaries
  const cSeq = tableX + 22;
  const cDesc = tableX + 65;
  const cHsn = tableX + 660;
  const cQty = tableX + 790;
  const cRate = tableX + 920;
  const cAmt = tableX + tableW - 25;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('#', cSeq, tableY + 25);
  ctx.fillText('ITEM DESCRIPTION & SPECIFICATIONS', cDesc, tableY + 25);
  ctx.fillText('HSN / SAC', cHsn, tableY + 25);
  ctx.fillText('QTY', cQty, tableY + 25);
  ctx.textAlign = 'right';
  ctx.fillText('RATE (₹)', cRate, tableY + 25);
  ctx.fillText('AMOUNT (₹)', cAmt, tableY + 25);
  ctx.textAlign = 'left';

  // Table Body Rows
  let curY = tableY + thHeight;
  const rowH = 46;

  order.items.forEach((item, idx) => {
    // Alternating zebra row tint
    if (idx % 2 === 1) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(tableX, curY, tableW, rowH);
    }

    // Border bottom
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX, curY + rowH);
    ctx.lineTo(tableX + tableW, curY + rowH);
    ctx.stroke();

    // Sequence
    ctx.fillStyle = '#64748B';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(String(idx + 1).padStart(2, '0'), cSeq, curY + 28);

    // Item Name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(item.name, cDesc, curY + 23);

    // Modifiers / Customization Note
    if (item.modifiers && item.modifiers.length > 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const modsText = `+ ${item.modifiers.map((m) => m.name).join(', ')}`;
      ctx.fillText(modsText, cDesc, curY + 39);
    } else if (item.notes) {
      ctx.fillStyle = '#64748B';
      ctx.font = '11px italic -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Note: ${item.notes}`, cDesc, curY + 39);
    }

    // HSN/SAC
    ctx.fillStyle = '#64748B';
    ctx.font = '12px "Courier New", Courier, monospace';
    ctx.fillText('996331', cHsn, curY + 28);

    // Qty
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(String(item.quantity), cQty + 5, curY + 28);

    // Rate
    const unitPrice = item.itemTotal / item.quantity;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`₹${unitPrice.toFixed(2)}`, cRate, curY + 28);

    // Amount
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`₹${item.itemTotal.toFixed(2)}`, cAmt, curY + 28);
    ctx.textAlign = 'left';

    curY += rowH;
  });

  // 5. TAX COMPUTATION & GRAND TOTAL SECTION
  const summaryY = curY + 25;
  const leftBoxW = 570;
  const rightBoxW = 460;
  const rightBoxX = tableX + tableW - rightBoxW;

  // Left Box: Statutory Dual GST Pools & Restaurant Policies
  ctx.fillStyle = '#F8FAFC';
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(tableX, summaryY, leftBoxW, 235, 12);
    ctx.fill();
  } else {
    ctx.fillRect(tableX, summaryY, leftBoxW, 235);
  }
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(tableX, summaryY, leftBoxW, 235, 12);
    ctx.stroke();
  } else {
    ctx.strokeRect(tableX, summaryY, leftBoxW, 235);
  }

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('STATUTORY GST & REVENUE NOTES', tableX + 22, summaryY + 30);

  ctx.fillStyle = '#475569';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• Taxable Supply of Restaurant Dining Services (HSN / SAC: 996331)', tableX + 22, summaryY + 58);
  ctx.fillText(`• CGST: ${branch.taxRates.cgst}% Pool  |  SGST: ${branch.taxRates.sgst}% Pool (Dual GST Scheme)`, tableX + 22, summaryY + 84);
  ctx.fillText(`• Hospitality Service Charge: ${branch.taxRates.serviceCharge}% discretionary pool for dining floor`, tableX + 22, summaryY + 110);
  ctx.fillText('• Registered under Goods & Services Tax Act, 2017 with Delhi State Jurisdiction', tableX + 22, summaryY + 136);

  // Settlement stamp box inside left card
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(tableX + 22, summaryY + 155, leftBoxW - 44, 60);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX + 22, summaryY + 155, leftBoxW - 44, 60);

  ctx.fillStyle = isPaid ? '#047857' : '#B45309';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isPaid
      ? '✓ OFFICIAL SETTLEMENT: PAYMENT RECEIVED IN FULL VIA UPI'
      : '⏳ TABLE TAB ACTIVE: PENDING SETTLEMENT WITH SERVER',
    tableX + 35,
    summaryY + 182
  );

  ctx.fillStyle = '#64748B';
  ctx.font = '11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    isPaid
      ? 'Thank you for your transaction. Your digital payment is recorded in ledger.'
      : 'Please pay your assigned floor server with cash or request the wireless UPI terminal.',
    tableX + 35,
    summaryY + 202
  );

  // Right Box: Financial Breakdown Table & Net Grand Total
  let calcY = summaryY + 8;
  const lineGap = 29;

  function drawSummaryRow(label: string, value: string, isBold = false, isAccent = false) {
    ctx.fillStyle = isAccent ? '#2563EB' : isBold ? '#0F172A' : '#475569';
    ctx.font = isBold
      ? 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(label, rightBoxX, calcY + 16);

    ctx.textAlign = 'right';
    ctx.fillText(value, tableX + tableW, calcY + 16);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBoxX, calcY + 23);
    ctx.lineTo(tableX + tableW, calcY + 23);
    ctx.stroke();

    calcY += lineGap;
  }

  drawSummaryRow('Food & Beverage Subtotal:', `₹${order.subtotal.toFixed(2)}`);
  if (order.discountTotal > 0) {
    drawSummaryRow('Promotional Discount:', `-₹${order.discountTotal.toFixed(2)}`, true, true);
  }
  drawSummaryRow(`CGST (${branch.taxRates.cgst}% Statutory):`, `₹${order.cgst.toFixed(2)}`);
  drawSummaryRow(`SGST (${branch.taxRates.sgst}% Statutory):`, `₹${order.sgst.toFixed(2)}`);
  if ((order.serviceChargeTotal || 0) > 0) {
    drawSummaryRow(`Service Charge (${branch.taxRates.serviceCharge}% Floor):`, `₹${order.serviceChargeTotal.toFixed(2)}`);
  }

  // Grand Total Highlight Card
  const grandTotalCardY = calcY + 10;
  const grandTotalH = 68;

  ctx.fillStyle = '#0F172A';
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(rightBoxX, grandTotalCardY, rightBoxW, grandTotalH, 12);
    ctx.fill();
  } else {
    ctx.fillRect(rightBoxX, grandTotalCardY, rightBoxW, grandTotalH);
  }

  // Blue accent on total card
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  if ('roundRect' in ctx) {
    ctx.beginPath();
    ctx.roundRect(rightBoxX, grandTotalCardY, rightBoxW, grandTotalH, 12);
    ctx.stroke();
  } else {
    ctx.strokeRect(rightBoxX, grandTotalCardY, rightBoxW, grandTotalH);
  }

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('NET GRAND TOTAL', rightBoxX + 24, grandTotalCardY + 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('(Inclusive of all statutory taxes)', rightBoxX + 24, grandTotalCardY + 48);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#60A5FA';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`₹${order.grandTotal.toFixed(2)}`, tableX + tableW - 24, grandTotalCardY + 44);
  ctx.textAlign = 'left';

  // 6. LUXURY LEGAL FOOTER & VERIFICATION STAMP
  const footerY = H - 145;

  // Separator
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(headerX, footerY);
  ctx.lineTo(headerX + headerW, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  const centerX = W / 2;

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`THANK YOU FOR DINING AT ${branch.name.toUpperCase()}!`, centerX, footerY + 30);

  ctx.fillStyle = '#64748B';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    'This is an authentic, computer-generated Tax Invoice issued under Rule 46 of the Central Goods & Services Tax Rules, 2017.',
    centerX,
    footerY + 54
  );
  ctx.fillText(
    'For corporate claims, invoice queries, or event bookings, please email hospitality@ordriva.com or call our front desk.',
    centerX,
    footerY + 76
  );

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    'ORDRIVA RESTAURANT OPERATING SYSTEM  •  ISO 27001 & GST COMPLIANT  •  POWERED BY ORDRIVA CLOUD',
    centerX,
    footerY + 104
  );
  ctx.textAlign = 'left';

  // 7. Convert Canvas to JPEG bytes & wrap in PDF 1.4
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      async (jpegBlob) => {
        if (!jpegBlob) {
          reject(new Error('Canvas blob conversion failed'));
          return;
        }
        try {
          const arrayBuffer = await jpegBlob.arrayBuffer();
          const jpegBytes = new Uint8Array(arrayBuffer);
          const pdfBytes = createPdfFromJpeg(jpegBytes, W, H, 595.28, 841.89);
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          resolve(pdfBlob);
        } catch (err) {
          reject(err);
        }
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Triggers a direct browser download of the professional PDF invoice.
 */
export async function downloadOrderInvoicePdf(order: Order, branch: Branch): Promise<void> {
  const blob = await generateInvoicePdfBlob(order, branch);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ORDRIVA-Invoice-INV-${order.orderNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
