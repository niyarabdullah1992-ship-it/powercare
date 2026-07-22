import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Visitor tracking for the public landing page + private stats for the platform owner.
// action "track": called anonymously by the landing page (public app) — writes via service role.
// action "stats": owner-only (platform admin) — aggregates visits for the Owner Panel.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Today's date in the app's local timezone (Asia/Riyadh)
    const dayOf = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(d);
    const today = dayOf(new Date());

    if (action === 'track') {
      const visitorId = String(body.visitorId || '').slice(0, 64);
      if (!visitorId) return Response.json({ error: 'visitorId required' }, { status: 400 });

      // Resolve visitor location from IP (best-effort, never blocks the visit)
      let country = '';
      let city = '';
      try {
        const countryCode = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || req.headers.get('x-country-code') || '';
        const headerCity = req.headers.get('x-vercel-ip-city') || req.headers.get('x-city') || '';
        if (countryCode && countryCode !== 'XX') {
          try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode.toUpperCase()) || countryCode; } catch { country = countryCode; }
          city = decodeURIComponent(headerCity).slice(0, 80);
        }
        const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
        // Only a syntactically valid IPv4/IPv6 value is ever placed in the URL.
        const isValidIp = /^(\d{1,3}(\.\d{1,3}){3}|[0-9a-fA-F:]+)$/.test(ip);
        if (!country && ip && isValidIp) {
          const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(3000) });
          const geo = await geoRes.json();
          if (geo && geo.success) {
            country = String(geo.country || '').slice(0, 80);
            city = String(geo.city || '').slice(0, 80);
          }
        }
      } catch (_e) { /* geo lookup is optional */ }

      const created = await base44.asServiceRole.entities.PageVisit.create({
        visitorId,
        path: String(body.path || '/').slice(0, 200),
        referrer: String(body.referrer || '').slice(0, 200),
        device: body.device === 'mobile' ? 'mobile' : 'desktop',
        day: today,
        country,
        city,
        durationSeconds: 0,
        lastSeenAt: new Date().toISOString(),
      });
      return Response.json({ ok: true, visitId: created.id });
    }

    if (action === 'duration') {
      const visitId = String(body.visitId || '');
      const visitorId = String(body.visitorId || '').slice(0, 64);
      if (!visitId || !visitorId) return Response.json({ error: 'Visit identity required' }, { status: 400 });
      const visit = await base44.asServiceRole.entities.PageVisit.get(visitId).catch(() => null);
      if (!visit || visit.visitorId !== visitorId) return Response.json({ error: 'Visit not found' }, { status: 404 });
      const durationSeconds = Math.min(86400, Math.max(Number(visit.durationSeconds) || 0, Math.floor(Number(body.durationSeconds) || 0)));
      await base44.asServiceRole.entities.PageVisit.update(visit.id, { durationSeconds, lastSeenAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }

    if (action === 'stats') {
      const user = await base44.auth.me().catch(() => null);
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Pull recent visits (paginated) — enough for totals + a 7-day chart.
      const all = [];
      let skip = 0;
      while (skip < 10000) {
        const page = await base44.asServiceRole.entities.PageVisit.list('-created_date', 500, skip);
        all.push(...page);
        if (page.length < 500) break;
        skip += 500;
      }

      const todayVisits = all.filter((v) => v.day === today);
      const uniq = (arr) => new Set(arr.map((v) => v.visitorId)).size;

      // Last 7 days series
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = dayOf(new Date(Date.now() - i * 86400000));
        const dayVisits = all.filter((v) => v.day === d);
        const durationTotal = dayVisits.reduce((sum, visit) => sum + Number(visit.durationSeconds || 0), 0);
        days.push({ day: d, visits: dayVisits.length, unique: uniq(dayVisits), averageDurationSeconds: dayVisits.length ? Math.round(durationTotal / dayVisits.length) : 0 });
      }

      // Top visitor locations (by unique visitors, then visits)
      const locMap = {};
      for (const v of all) {
        const key = v.country ? `${v.country}|${v.city || ''}` : null;
        if (!key) continue;
        if (!locMap[key]) locMap[key] = { country: v.country, city: v.city || '', visits: 0, duration: 0, visitors: new Set() };
        locMap[key].visits++;
        locMap[key].duration += Number(v.durationSeconds || 0);
        locMap[key].visitors.add(v.visitorId);
      }
      const locations = Object.values(locMap)
        .map((l) => ({ country: l.country, city: l.city, visits: l.visits, unique: l.visitors.size, averageDurationSeconds: l.visits ? Math.round(l.duration / l.visits) : 0 }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 15);

      const totalDuration = all.reduce((sum, visit) => sum + Number(visit.durationSeconds || 0), 0);
      const todayDuration = todayVisits.reduce((sum, visit) => sum + Number(visit.durationSeconds || 0), 0);
      return Response.json({
        todayVisits: todayVisits.length,
        todayUnique: uniq(todayVisits),
        totalVisits: all.length,
        totalUnique: uniq(all),
        averageVisitSeconds: all.length ? Math.round(totalDuration / all.length) : 0,
        todayAverageVisitSeconds: todayVisits.length ? Math.round(todayDuration / todayVisits.length) : 0,
        days,
        locations,
        recentVisits: all.slice(0, 20).map((visit) => ({ id: visit.id, createdAt: visit.created_date, country: visit.country || '', city: visit.city || '', device: visit.device || '', durationSeconds: Number(visit.durationSeconds || 0) })),
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('pageVisits error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});