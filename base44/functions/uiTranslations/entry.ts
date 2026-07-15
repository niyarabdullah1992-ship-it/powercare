import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Server-side UI translation cache: translates missing UI strings once with the
// LLM, stores them in the UiTranslation entity, and serves the full map to every
// client instantly afterwards.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lang, langLabel, keys } = await req.json();
    if (!lang || typeof lang !== "string" || !/^[a-z]{2}$/.test(lang) || !keys || typeof keys !== "object") {
      return Response.json({ error: "lang and keys are required" }, { status: 400 });
    }

    const rows = await base44.asServiceRole.entities.UiTranslation.filter({ lang });
    let row = rows[0];
    const stored = (row && row.payload) || {};

    const missing = Object.entries(keys).filter(
      ([k, v]) => typeof v === "string" && v.trim() && !stored[k]
    );

    if (missing.length) {
      for (let i = 0; i < missing.length; i += 60) {
        const batch = Object.fromEntries(missing.slice(i, i + 60));
        try {
          const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Translate every value in this JSON object into the language "${langLabel || lang}" (ISO code: ${lang}). Return one item per key, with the key unchanged and the translated value. Use natural, professional UI wording. Keep product names such as PowerCare, Niro, PDF, Excel and GPS unchanged. JSON: ${JSON.stringify(batch)}`,
            response_json_schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { key: { type: "string" }, value: { type: "string" } },
                    required: ["key", "value"],
                  },
                },
              },
              required: ["items"],
            },
          });
          for (const item of res?.items || []) {
            if (item && typeof item.value === "string" && item.value.trim() && item.key in keys) {
              stored[item.key] = item.value;
            }
          }
        } catch (e) {
          console.error("Translation batch failed:", e.message);
        }
      }
      if (row) {
        await base44.asServiceRole.entities.UiTranslation.update(row.id, { payload: stored });
      } else {
        row = await base44.asServiceRole.entities.UiTranslation.create({ lang, payload: stored });
      }
    }

    return Response.json({ translations: stored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});