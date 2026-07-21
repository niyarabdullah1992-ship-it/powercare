export async function authPowerCareSession(base44, companyId, sessionToken) {
  const user = await base44.auth.me().catch(() => null);
  if (user?.role === 'admin') return { admin: true, userId: user.id, name: user.full_name || 'Admin', email: user.email || '', role: 'admin' };
  if (!companyId || !sessionToken) return null;
  const sessions = await base44.asServiceRole.entities.CompanySession.filter({ token: sessionToken, companyId });
  const session = sessions[0];
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  if (session.userId) {
    const employees = await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: session.userId });
    const employee = employees[0];
    return employee ? { userId: employee.employeeId, name: employee.name, email: String(employee.email || '').toLowerCase(), role: employee.role, stationId: employee.stationId || null, hrLevelId: employee.hrLevelId || null } : null;
  }
  const [accounts, metaRows] = await Promise.all([
    base44.asServiceRole.entities.CompanyAccount.filter({ companyId }),
    base44.asServiceRole.entities.CompanyDataBlob.filter({ companyId, category: 'companyMeta' }),
  ]);
  const account = accounts[0];
  if (!account) return null;
  const ownerId = metaRows[0]?.payload?.[0]?.ownerId || null;
  const owners = ownerId ? await base44.asServiceRole.entities.Employee.filter({ companyId, employeeId: ownerId }) : [];
  const owner = owners[0];
  return { owner: true, userId: ownerId, name: owner?.name || 'Owner', email: String(account.ownerEmail || '').toLowerCase(), role: 'owner', stationId: null };
}