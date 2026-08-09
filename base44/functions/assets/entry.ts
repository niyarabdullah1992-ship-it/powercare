import { createClientFromRequest } from "npm:@base44/sdk@0.8.38";
import { authPowerCareSession } from "../../shared/powerCareSession.ts";

// Assets & custody: every asset has exactly one holder, and every transfer is
// signed by both sides. All writes are authorized by the active company session.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const companyId = body.companyId;
    const auth = await authPowerCareSession(base44, companyId, body.sessionToken);
    if (!auth || !companyId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole.entities;
    const actor = { id: auth.userId || "owner", name: auth.name || "—" };

    const audit = async (action: string, details: string) => {
      const row = await svc.AuditLog.create({ companyId, action, performedBy: actor.name, details });
      return row?.id || null;
    };

    if (body.action === "list") {
      const [assets, custody, maintenance] = await Promise.all([
        svc.Asset.filter({ companyId }),
        svc.AssetCustody.filter({ companyId }),
        svc.AssetMaintenance.filter({ companyId }),
      ]);
      return Response.json({ assets, custody, maintenance });
    }

    if (body.action === "saveAsset") {
      const payload = { ...body.asset, companyId };
      // Rule 1 — an asset is never without a holder.
      if (!payload.holderId) {
        payload.holderId = actor.id;
        payload.holderName = actor.name;
      }
      let asset;
      if (body.assetId) {
        asset = await svc.Asset.update(body.assetId, payload);
        await audit("asset_updated", `${payload.name} (${payload.assetCode})`);
      } else {
        payload.qrCode = payload.qrCode || `AST-${Date.now().toString(36).toUpperCase()}`;
        asset = await svc.Asset.create(payload);
        await audit("asset_created", `${payload.name} (${payload.assetCode})`);
        await svc.AssetCustody.create({
          companyId, assetId: asset.id, fromId: null, fromName: "—",
          toId: payload.holderId, toName: payload.holderName || "—",
          stationId: payload.stationId || null, handedAt: new Date().toISOString(),
          condition: body.asset?.condition || "", notes: "initial",
        });
      }
      return Response.json({ asset });
    }

    if (body.action === "handover") {
      const { assetId, toId, toName, condition, imageUrls, fromSignatureUrl, toSignatureUrl, notes } = body;
      // Rule 2 — a handover is valid only when both parties signed.
      if (!fromSignatureUrl || !toSignatureUrl) return Response.json({ error: "SignaturesRequired" }, { status: 400 });
      const assets = await svc.Asset.filter({ companyId, id: assetId });
      const asset = assets[0];
      if (!asset) return Response.json({ error: "NotFound" }, { status: 404 });

      const auditRef = await audit("asset_handover", `${asset.name} (${asset.assetCode}): ${asset.holderName || "—"} → ${toName}`);
      const record = await svc.AssetCustody.create({
        companyId, assetId, fromId: asset.holderId || null, fromName: asset.holderName || "—",
        toId, toName, stationId: asset.stationId || null, handedAt: new Date().toISOString(),
        condition: condition || "", imageUrls: imageUrls || [],
        fromSignatureUrl, toSignatureUrl, auditRef, notes: notes || "",
      });
      const updated = await svc.Asset.update(assetId, { holderId: toId, holderName: toName, status: "in_custody" });
      return Response.json({ asset: updated, custody: record });
    }

    if (body.action === "logMaintenance") {
      const record = await svc.AssetMaintenance.create({ ...body.maintenance, companyId, assetId: body.assetId });
      if (body.nextInspectionDate || body.status) {
        await svc.Asset.update(body.assetId, {
          ...(body.nextInspectionDate ? { nextInspectionDate: body.nextInspectionDate } : {}),
          ...(body.status ? { status: body.status } : {}),
        });
      }
      await audit("asset_maintenance", `${body.assetId}: ${body.maintenance?.type || ""}`);
      return Response.json({ maintenance: record });
    }

    if (body.action === "setStatus") {
      // Rule 5 — a lost asset opens an investigation closed only by a documented decision.
      const patch: Record<string, unknown> = { status: body.status };
      if (body.status === "lost") {
        patch.lostCase = { openedAt: new Date().toISOString(), openedBy: actor.name, reason: body.reason || "" };
      }
      const updated = await svc.Asset.update(body.assetId, patch);
      await audit("asset_status", `${body.assetId} → ${body.status}${body.reason ? `: ${body.reason}` : ""}`);
      return Response.json({ asset: updated });
    }

    if (body.action === "resolveLost") {
      const auditRef = await audit("asset_lost_resolved", `${body.assetId}: ${body.decision} — ${body.reason || ""}`);
      const updated = await svc.Asset.update(body.assetId, {
        status: body.decision === "charged" ? "retired" : "available",
        lostCase: { ...(body.lostCase || {}), closedAt: new Date().toISOString(), closedBy: actor.name, decision: body.decision, reason: body.reason || "", auditRef },
      });
      return Response.json({ asset: updated });
    }

    if (body.action === "deleteAsset") {
      await svc.Asset.delete(body.assetId);
      await audit("asset_deleted", body.assetId);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "UnknownAction" }, { status: 400 });
  } catch (error) {
    console.error("assets error", error);
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});