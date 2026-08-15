/** Tenant letterhead — one source for app chrome and exports. */
export function companyBrandFrom(data, company) {
  const branding = data?.reportBranding || {};
  const logoUrl = String(branding.logoUrl || "").trim();
  return {
    logoUrl,
    color: branding.color || "",
    name: String(company?.name || data?.name || "").trim(),
  };
}
