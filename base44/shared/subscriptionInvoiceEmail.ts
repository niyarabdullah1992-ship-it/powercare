import { jsPDF } from 'npm:jspdf@4.2.1';
import { createMimeMessage } from 'npm:mimetext@3.0.24';
import { POWERCARE_LOGO_URL, BRAND_NAME, BRAND_NAVY, BRAND_GREEN, BRAND_BG, BRAND_BORDER } from './brand.ts';

const toBase64Url = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const money = (value, currency) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: currency || 'SAR',
}).format((Number(value) || 0) / 100);

const drawPanel = (doc, x, y, width, height) => {
  doc.setFillColor(23, 45, 84);
  doc.setDrawColor(63, 88, 130);
  doc.roundedRect(x, y, width, height, 4, 4, 'FD');
  doc.setDrawColor(30, 158, 99);
  doc.setLineWidth(0.45);
  doc.line(x + 5, y, x + 30, y);
};

const createInvoicePdf = async (invoice) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setFillColor(14, 29, 56);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(20, 40, 75);
  doc.circle(187, 22, 42, 'F');
  doc.setFillColor(18, 36, 68);
  doc.circle(18, 278, 48, 'F');

  try {
    const logoResponse = await fetch(POWERCARE_LOGO_URL);
    if (logoResponse.ok) doc.addImage(new Uint8Array(await logoResponse.arrayBuffer()), 'PNG', 18, 15, 22, 22);
  } catch (error) {
    console.error('Invoice logo load failed:', error.message);
  }

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('NIROVERA', 47, 24);
  doc.setTextColor(30, 158, 99);
  doc.setFontSize(9);
  doc.text('OFFICIAL TAX INVOICE', 47, 31);
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(11);
  doc.text(String(invoice.invoiceNumber || '—'), 192, 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 197, 205);
  doc.text(new Date(invoice.paidAt || invoice.createdAt).toLocaleDateString('en-GB'), 192, 30, { align: 'right' });

  drawPanel(doc, 18, 48, 174, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 158, 99);
  doc.text('BILL TO', 25, 59);
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(13);
  doc.text(String(invoice.companyName || 'NiroVera customer').slice(0, 64), 25, 69);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 205, 212);
  doc.text(String(invoice.email || '—'), 25, 78);
  doc.text(`Customer ID: ${String(invoice.companyId || 'New subscription')}`, 25, 84);

  drawPanel(doc, 18, 99, 174, 49);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 158, 99);
  doc.text('SUBSCRIPTION DETAILS', 25, 111);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(10);
  doc.text(`Plan`, 25, 124);
  doc.text(String(invoice.plan || '—'), 184, 124, { align: 'right' });
  doc.text(`Billing cycle`, 25, 135);
  doc.text(String(invoice.billing || '—'), 184, 135, { align: 'right' });
  doc.setTextColor(180, 197, 205);
  doc.setFontSize(8);
  doc.text(`Payment reference: ${String(invoice.paymentReference || invoice.chargeId || '—')}`, 25, 143);

  drawPanel(doc, 18, 157, 174, 63);
  const totalRow = (label, value, y, total = false) => {
    doc.setFont('helvetica', total ? 'bold' : 'normal');
    doc.setFontSize(total ? 14 : 10);
    doc.setTextColor(total ? 30 : 232, total ? 158 : 238, total ? 99 : 241);
    doc.text(label, 25, y);
    doc.text(value, 184, y, { align: 'right' });
  };
  totalRow('Subtotal', money(invoice.subtotal, invoice.currency), 173);
  totalRow('VAT (15%)', money(invoice.tax, invoice.currency), 187);
  doc.setDrawColor(63, 88, 130);
  doc.line(25, 196, 184, 196);
  totalRow('TOTAL PAID', money(invoice.total, invoice.currency), 210, true);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(159, 180, 190);
  doc.setFontSize(8);
  doc.text('This electronically generated invoice is an official NiroVera financial record.', 105, 248, { align: 'center' });
  doc.text('NiroVera  •  Secure subscription billing', 105, 257, { align: 'center' });
  doc.setTextColor(30, 158, 99);
  doc.text('nirovera.com', 105, 266, { align: 'center' });
  return new Uint8Array(doc.output('arraybuffer'));
};

export async function sendSubscriptionInvoiceEmail(base44, invoice) {
  const pdf = await createInvoicePdf(invoice);
  const subject = `${BRAND_NAME} invoice ${invoice.invoiceNumber}`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;background:${BRAND_BG};padding:28px;color:${BRAND_NAVY}"><div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid ${BRAND_BORDER};border-top:4px solid ${BRAND_GREEN}"><h2 style="margin-top:0">فاتورة اشتراك ${BRAND_NAME}</h2><p>تم تأكيد دفعتك بنجاح. تجد الفاتورة الرسمية مرفقة بصيغة PDF.</p><hr style="border:0;border-top:1px solid ${BRAND_BORDER}"><div dir="ltr"><h3>${BRAND_NAME} subscription invoice</h3><p>Your payment was confirmed successfully. Your official PDF invoice is attached.</p><p><strong>${invoice.invoiceNumber}</strong> · ${money(invoice.total, invoice.currency)}</p></div></div></div>`;
  const message = createMimeMessage();
  message.setSender({ name: BRAND_NAME, addr: 'no-reply@nirovera.com' });
  message.setRecipient(invoice.email);
  message.setSubject(subject);
  message.addMessage({ contentType: 'text/html', data: html });
  message.addAttachment({ filename: `${invoice.invoiceNumber}.pdf`, contentType: 'application/pdf', data: pdf });
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(message.asRaw()) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Invoice email failed (${response.status})`);
  }
}