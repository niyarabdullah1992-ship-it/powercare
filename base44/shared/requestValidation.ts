/** Shared Zod helpers for Base44 function request validation. */
import { z } from "npm:zod@3.24.2";

export { z };

export const companyIdSchema = z.string().trim().min(1, "companyId is required");
export const actionSchema = z.string().trim().min(1, "action is required");
export const sessionTokenSchema = z.string().trim().min(1).optional();
export const employeeIdSchema = z.string().trim().min(1, "employeeId is required");
export const entityIdSchema = z.string().trim().min(1);

export const tenantRequestSchema = z
  .object({
    companyId: companyIdSchema,
    action: actionSchema,
    sessionToken: sessionTokenSchema,
  })
  .passthrough();

export const geoCoordsSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
  accuracy: z.number().finite().optional(),
});

export const proofFileSchema = z.object({
  url: z.string().min(1),
  name: z.string().optional(),
});

export type ValidationIssue = { path: string; message: string };

export function formatZodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

export function validationFailed(error: z.ZodError) {
  return Response.json(
    {
      error: "VALIDATION_FAILED",
      reason: "طلب غير صالح — تحقق من الحقول المرسلة.",
      reasonEn: "Invalid request — check submitted fields.",
      issues: formatZodIssues(error),
    },
    { status: 400 },
  );
}

export function parseTenantRequest(body: unknown) {
  return tenantRequestSchema.safeParse(body);
}

/** Validate tenant shell, then action-specific schema when registered. */
export function validateActionRequest<T extends z.ZodTypeAny>(
  body: unknown,
  actionSchemas: Record<string, T>,
) {
  const tenant = parseTenantRequest(body);
  if (!tenant.success) return tenant;
  const action = tenant.data.action;
  const schema = actionSchemas[action];
  if (!schema) return tenant;
  return schema.safeParse(body);
}
