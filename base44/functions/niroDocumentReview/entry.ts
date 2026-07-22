import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { authPowerCareSession } from '../../shared/powerCareSession.ts';

const trustedHosts = new Set(['media.base44.com', 'base44.app']);
const validPdfUrl = (value) => { try { const url = new URL(String(value || '')); return url.protocol === 'https:' && trustedHosts.has(url.hostname.toLowerCase()) && !url.username && !url.password; } catch { return false; } };
const verificationId = () => { const bytes = crypto.getRandomValues(new Uint8Array(6)); const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(''); return `PWC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`; };
const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  let review = null;
  let base44 = null;
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (body.action !== 'review') return Response.json({ error: 'Unknown action' }, { status: 400 });
    const companyId = String(body.companyId || '').slice(0, 64);
    const actor = await authPowerCareSession(base44, companyId, String(body.sessionToken || ''));
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const allowed = new Set(['owner', 'director', 'ops_manager', 'pgm', 'station_manager']);
    if (!actor.admin && !allowed.has(actor.role) && !actor.hrLevelId) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const sourceUrl = String(body.docUrl || '').slice(0, 2000);
    const fileName = String(body.fileName || '').slice(0, 200);
    if (!validPdfUrl(sourceUrl) || !fileName.toLowerCase().endsWith('.pdf')) return Response.json({ error: 'A valid PDF is required' }, { status: 400 });
    const now = new Date().toISOString();
    review = await base44.asServiceRole.entities.NiroDocumentReview.create({ companyId, actorId: actor.userId || 'admin', actorName: actor.name, actorRole: actor.role || 'admin', fileName, sourceUrl, status: 'analyzing', sealedUrl: null, verificationId: null, fileHash: null, auditTrail: [{ type: 'uploaded_for_ai_review', at: now, actorName: actor.name, actorRole: actor.role || 'admin' }] });
    const report = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'You are Niro, a rigorous enterprise document compliance reviewer. Analyze the attached document, infer its document type and the fields, approvals, dates, identities, references, measurements, attachments, and signatures normally required for that type. For HSE and safety reports, verify incident date/time/location, people involved, hazard classification, risk assessment, immediate action, corrective action, responsible person, deadlines, evidence, and approvals when applicable. Mark complete=true only when all material requirements can be verified from the document itself. Do not invent evidence. Return concise findings in the document language.',
      file_urls: [sourceUrl],
      response_json_schema: { type: 'object', properties: { documentType: { type: 'string' }, summary: { type: 'string' }, complete: { type: 'boolean' }, confidence: { type: 'number' }, requiredChecks: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, status: { type: 'string', enum: ['complete', 'missing', 'unclear'] }, evidence: { type: 'string' } }, required: ['label', 'status', 'evidence'] } }, missingItems: { type: 'array', items: { type: 'string' } }, riskNotes: { type: 'array', items: { type: 'string' } } }, required: ['documentType', 'summary', 'complete', 'confidence', 'requiredChecks', 'missingItems', 'riskNotes'] }
    });
    const checks = Array.isArray(report.requiredChecks) ? report.requiredChecks : [];
    const complete = report.complete === true && (report.missingItems || []).length === 0 && !checks.some((item) => item.status !== 'complete');
    const analyzedAt = new Date().toISOString();
    const analyzedEvent = { type: 'niro_analysis_completed', at: analyzedAt, actorName: 'Niro', complete, confidence: Number(report.confidence) || 0 };
    if (!complete) {
      await base44.asServiceRole.entities.NiroDocumentReview.update(review.id, { status: 'needs_attention', report: { ...report, complete: false }, auditTrail: [...review.auditTrail, analyzedEvent] });
      return Response.json({ ok: true, sealed: false, reviewId: review.id, report: { ...report, complete: false }, auditTrail: [...review.auditTrail, analyzedEvent] });
    }
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok) throw new Error('Unable to download PDF');
    const pdf = await PDFDocument.load(await sourceResponse.arrayBuffer());
    const page = pdf.getPages().at(-1);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const accounts = await base44.asServiceRole.entities.CompanyAccount.filter({ companyId });
    const rawName = String(accounts[0]?.name || 'POWERCARE COMPANY');
    const companyName = /^[\x20-\x7E]+$/.test(rawName) ? rawName.slice(0, 38) : 'POWERCARE COMPANY';
    const sealId = verificationId();
    const width = 220; const height = 78; const x = Math.max(24, page.getWidth() - width - 28); const y = 28;
    page.drawRectangle({ x, y, width, height, color: rgb(0.98, 0.96, 0.92), borderColor: rgb(0.70, 0.48, 0.22), borderWidth: 2, opacity: 0.96 });
    page.drawText('NIRO VERIFIED · DIGITAL COMPANY SEAL', { x: x + 10, y: y + 57, size: 8, font: bold, color: rgb(0.25, 0.18, 0.12) });
    page.drawText(companyName, { x: x + 10, y: y + 39, size: 10, font: bold, color: rgb(0.18, 0.14, 0.10) });
    page.drawText(sealId, { x: x + 10, y: y + 23, size: 8, font, color: rgb(0.45, 0.30, 0.14) });
    page.drawText(new Date().toISOString(), { x: x + 10, y: y + 9, size: 6.5, font, color: rgb(0.36, 0.32, 0.28) });
    const sealedBytes = await pdf.save();
    const fileHash = await sha256(sealedBytes);
    const stampedFile = new File([sealedBytes], fileName.replace(/\.pdf$/i, '-niro-sealed.pdf'), { type: 'application/pdf' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file: stampedFile });
    await base44.asServiceRole.entities.SignedDocument.create({ verificationId: sealId, fileHash, signerName: `${rawName} Digital Seal (Niro)`.slice(0, 120), signerId: actor.userId || 'admin', companyId, fileName, signedAt: new Date().toISOString() });
    const sealEvent = { type: 'digital_company_seal_applied', at: new Date().toISOString(), actorName: 'Niro', authorizedBy: actor.name, verificationId: sealId, documentHash: fileHash };
    const auditTrail = [...review.auditTrail, analyzedEvent, sealEvent];
    await Promise.all([
      base44.asServiceRole.entities.NiroDocumentReview.update(review.id, { status: 'sealed', report: { ...report, complete: true }, sealedUrl: uploaded.file_url, verificationId: sealId, fileHash, auditTrail }),
      base44.asServiceRole.entities.AuditLog.create({ companyId, action: 'niro_document_sealed', performedBy: `${actor.name} via Niro`, details: `Niro verified and digitally sealed ${fileName}. Verification ID: ${sealId}. SHA-256: ${fileHash}` })
    ]);
    return Response.json({ ok: true, sealed: true, reviewId: review.id, report: { ...report, complete: true }, sealedUrl: uploaded.file_url, verificationId: sealId, fileHash, auditTrail });
  } catch (error) {
    console.error('niroDocumentReview error:', error);
    if (base44 && review?.id) {
      await base44.asServiceRole.entities.NiroDocumentReview.update(review.id, {
        status: 'error',
        report: { complete: false, error: String(error.message || 'Document review failed') },
        auditTrail: [...(review.auditTrail || []), { type: 'niro_analysis_failed', at: new Date().toISOString(), actorName: 'Niro', error: String(error.message || 'Document review failed').slice(0, 500) }],
      }).catch(() => null);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});