import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Admin-only one-shot seeder: builds a complete demo company ("United Energy")
// with stations, employees, tasks, folders, HSE incidents, signatures,
// complaints and attendance — for presenting PowerCare to a corporate group.
const COMPANY_ID = 'comp_demo_united';
const OWNER_EMAIL = 'niyar@powercares.pro';
const OWNER_PASSWORD = 'Demo@2026';

async function pbkdf2Password(password, salt, iterations = 100000) {
  const s = salt || crypto.randomUUID().replace(/-/g, '');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(s), iterations },
    key, 256,
  );
  const hex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${iterations}$${s}$${hex}`;
}

const daysAgo = (n, h = 9) => new Date(Date.now() - n * 86400000 - (24 - h) * 0).toISOString();
const iso = (n) => new Date(Date.now() - n * 86400000).toISOString();
const future = (n) => new Date(Date.now() + n * 86400000).toISOString();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole.entities;

    /* ---------- wipe any previous demo run (idempotent) ---------- */
    const wipe = async (entity, query) => {
      const rows = await entity.filter(query);
      for (const r of rows) await entity.delete(r.id);
    };
    await wipe(svc.Employee, { companyId: COMPANY_ID });
    await wipe(svc.Station, { companyId: COMPANY_ID });
    await wipe(svc.CompanyDataBlob, { companyId: COMPANY_ID });
    await wipe(svc.CompanyAccount, { companyId: COMPANY_ID });
    await wipe(svc.SignedDocument, { companyId: COMPANY_ID });
    await wipe(svc.EmployeeCredential, { companyId: COMPANY_ID });

    /* ---------- company account ---------- */
    await svc.CompanyAccount.create({
      companyId: COMPANY_ID,
      name: 'شركة الطاقة المتحدة | United Energy',
      ownerEmail: OWNER_EMAIL,
      ownerPassword: await pbkdf2Password(OWNER_PASSWORD),
      plan: 'Enterprise',
      allowedEmailDomain: '',
    });

    /* ---------- stations ---------- */
    const stations = [
      { stationId: 'st_d_1', name: 'محطة الرياض للطاقة الشمسية', location: 'Riyadh', type: 'Solar PV', status: 'active', lat: 24.7136, lng: 46.6753, radiusMeters: 300 },
      { stationId: 'st_d_2', name: 'محطة جدة للتحلية', location: 'Jeddah', type: 'Desalination', status: 'active', lat: 21.4858, lng: 39.1925, radiusMeters: 300 },
      { stationId: 'st_d_3', name: 'محطة الدمام للتوليد', location: 'Dammam', type: 'Power', status: 'active', lat: 26.4207, lng: 50.0888, radiusMeters: 300 },
      { stationId: 'st_d_4', name: 'محطة نيوم للهيدروجين الأخضر', location: 'NEOM', type: 'Green Hydrogen', status: 'active', lat: 28.1099, lng: 35.0, radiusMeters: 300 },
      { stationId: 'st_d_5', name: 'محطة أبها لطاقة الرياح', location: 'Abha', type: 'Wind', status: 'maintenance', lat: 18.2465, lng: 42.5117, radiusMeters: 300 },
    ];

    /* ---------- employees ---------- */
    const cert = (title, status, reviewedBy) => ({
      id: 'cert_' + Math.random().toString(36).slice(2, 8), title, name: title,
      category: 'HSE', status, reviewedBy: reviewedBy || null,
      issuedBy: 'المؤسسة العامة للتدريب التقني', expiryDate: future(300).slice(0, 10), createdAt: iso(40),
    });
    const leave = (type, status, start, days) => ({
      id: 'leave_' + Math.random().toString(36).slice(2, 8), type,
      startDate: iso(start), endDate: iso(start - days + 1), days,
      reason: type === 'annual' ? 'إجازة سنوية' : 'ظرف عائلي', files: [],
      status, reviewedBy: status === 'pending' ? null : 'تركي المطيري', createdAt: iso(start + 2),
    });

    const employees = [
      { employeeId: 'emp_d_dir', name: 'تركي المطيري', email: OWNER_EMAIL, role: 'director', stationId: null, phone: '+966595414472', position: 'المدير التنفيذي', points: 0 },
      { employeeId: 'emp_d_ops', name: 'سارة الحربي', email: 'sara@united-energy.demo', role: 'ops_manager', stationId: null, phone: '+966500000002', position: 'مدير العمليات', points: 120 },
      { employeeId: 'emp_d_pgm', name: 'فيصل القحطاني', email: 'faisal@united-energy.demo', role: 'pgm', stationId: null, managedStations: ['st_d_1', 'st_d_2'], canManageTeam: true, phone: '+966500000003', position: 'مدير برامج', points: 95 },
      { employeeId: 'emp_d_m1', name: 'نورة السبيعي', email: 'nora@united-energy.demo', role: 'station_manager', stationId: 'st_d_1', phone: '+966500000004', position: 'مدير محطة', points: 88 },
      { employeeId: 'emp_d_m2', name: 'عمر الدوسري', email: 'omar@united-energy.demo', role: 'station_manager', stationId: 'st_d_2', phone: '+966500000005', position: 'مدير محطة', points: 76 },
      { employeeId: 'emp_d_m3', name: 'خالد العتيبي', email: 'khalid@united-energy.demo', role: 'station_manager', stationId: 'st_d_3', phone: '+966500000006', position: 'مدير محطة', points: 82 },
      { employeeId: 'emp_d_m4', name: 'ريم الشمري', email: 'reem@united-energy.demo', role: 'station_manager', stationId: 'st_d_4', phone: '+966500000007', position: 'مدير محطة', points: 91 },
      { employeeId: 'emp_d_m5', name: 'بدر الغامدي', email: 'bader@united-energy.demo', role: 'station_manager', stationId: 'st_d_5', phone: '+966500000008', position: 'مدير محطة', points: 60 },
      { employeeId: 'emp_d_e1', name: 'علي المطيري', email: 'ali@united-energy.demo', role: 'employee', stationId: 'st_d_1', phone: '+966500000011', position: 'فني صيانة أول', points: 145, certificates: [cert('شهادة السلامة الصناعية OSHA', 'approved', 'نورة السبيعي'), cert('رخصة أعمال كهربائية', 'approved', 'نورة السبيعي')], leaveRequests: [leave('annual', 'approved', 60, 7)] },
      { employeeId: 'emp_d_e2', name: 'منى الشهري', email: 'mona@united-energy.demo', role: 'employee', stationId: 'st_d_1', phone: '+966500000012', position: 'مهندسة تشغيل', points: 130, certificates: [cert('شهادة إسعافات أولية', 'approved', 'نورة السبيعي')], leaveRequests: [leave('sick', 'approved', 20, 2)] },
      { employeeId: 'emp_d_e3', name: 'حسن الغامدي', email: 'hassan@united-energy.demo', role: 'employee', stationId: 'st_d_2', phone: '+966500000013', position: 'فني تحلية', points: 110, certificates: [cert('معالجة المياه المتقدمة', 'pending')], leaveRequests: [leave('annual', 'pending', -3, 5)] },
      { employeeId: 'emp_d_e4', name: 'ليلى الزهراني', email: 'layla@united-energy.demo', role: 'employee', stationId: 'st_d_2', phone: '+966500000014', position: 'أخصائية جودة', points: 98 },
      { employeeId: 'emp_d_e5', name: 'ماجد العنزي', email: 'majed@united-energy.demo', role: 'employee', stationId: 'st_d_3', phone: '+966500000015', position: 'مشغل توربينات', points: 105, certificates: [cert('تشغيل التوربينات الغازية', 'approved', 'خالد العتيبي')] },
      { employeeId: 'emp_d_e6', name: 'هند القرني', email: 'hind@united-energy.demo', role: 'employee', stationId: 'st_d_3', phone: '+966500000016', position: 'مهندسة كهرباء', points: 87 },
      { employeeId: 'emp_d_e7', name: 'سلطان الرشيدي', email: 'sultan@united-energy.demo', role: 'employee', stationId: 'st_d_4', phone: '+966500000017', position: 'فني هيدروجين', points: 92, leaveRequests: [leave('annual', 'pending', -5, 4)] },
      { employeeId: 'emp_d_e8', name: 'أمل الجهني', email: 'amal@united-energy.demo', role: 'employee', stationId: 'st_d_4', phone: '+966500000018', position: 'منسقة سلامة (HSE)', points: 150, certificates: [cert('NEBOSH IGC', 'approved', 'ريم الشمري')] },
      { employeeId: 'emp_d_e9', name: 'يوسف البقمي', email: 'yousef@united-energy.demo', role: 'employee', stationId: 'st_d_5', phone: '+966500000019', position: 'فني توربينات رياح', points: 70 },
      { employeeId: 'emp_d_e10', name: 'دانة السالم', email: 'dana@united-energy.demo', role: 'employee', stationId: 'st_d_5', phone: '+966500000020', position: 'إدارية موقع', points: 65 },
    ].map((e) => ({
      companyId: COMPANY_ID, anonymousId: 'ANON-' + Math.random().toString(16).slice(2, 10).toUpperCase(),
      profile: { department: e.stationId ? 'العمليات' : 'الإدارة العامة', joinDate: '2024-03-01', nationality: 'سعودي' },
      ...e,
    }));

    const stationsWithMgr = stations.map((s, i) => ({ ...s, companyId: COMPANY_ID, managerId: ['emp_d_m1', 'emp_d_m2', 'emp_d_m3', 'emp_d_m4', 'emp_d_m5'][i] }));
    await svc.Station.bulkCreate(stationsWithMgr);
    await svc.Employee.bulkCreate(employees);

    /* ---------- data blobs ---------- */
    const blob = (category, payload) => svc.CompanyDataBlob.create({ companyId: COMPANY_ID, category, payload });

    await blob('companyMeta', [{
      id: 'meta', name: 'شركة الطاقة المتحدة | United Energy', plan: 'Enterprise',
      directorId: 'emp_d_dir', ownerId: 'emp_d_dir', stationChatGroups: [],
      settings: { rateLimitDaily: 3, rateLimitWeekly: 10, rateLimitMonthly: 30 },
    }]);

    // HSE safety — incident logs spanning 3 months, approved data (one station pending)
    await blob('safety', [
      { id: 'safe_d_1', stationId: 'st_d_1', level: 'green', lastInspection: iso(6), incidents: 1, hazards: [], approvedBy: 'تركي المطيري', approvedAt: iso(2), lastIncidentAt: iso(85), incidentLog: [{ id: 'inc_1', description: 'إصابة طفيفة أثناء صيانة العاكس رقم 4 — تم الإسعاف موقعيًا', at: iso(85) }] },
      { id: 'safe_d_2', stationId: 'st_d_2', level: 'amber', lastInspection: iso(12), incidents: 2, hazards: ['تسريب بسيط في خط الملوحة رقم 2'], approvedBy: 'تركي المطيري', approvedAt: iso(3), lastIncidentAt: iso(18), incidentLog: [{ id: 'inc_2', description: 'انزلاق عامل قرب حوض الترسيب — دون إصابات', at: iso(18) }, { id: 'inc_3', description: 'ملامسة مواد كيميائية دون معدات وقاية — تمت المعالجة', at: iso(55) }] },
      { id: 'safe_d_3', stationId: 'st_d_3', level: 'green', lastInspection: iso(4), incidents: 0, hazards: [], approvedBy: 'سارة الحربي', approvedAt: iso(1), incidentLog: [] },
      { id: 'safe_d_4', stationId: 'st_d_4', level: 'green', lastInspection: iso(8), incidents: 0, hazards: [], approvedBy: 'ريم الشمري', approvedAt: iso(2), incidentLog: [] },
      { id: 'safe_d_5', stationId: 'st_d_5', level: 'red', lastInspection: iso(35), incidents: 3, hazards: ['طفاية حريق منتهية الصلاحية في المستودع', 'سلم وصول التوربين رقم 7 يحتاج استبدال'], approvedBy: null, approvedAt: null, lastIncidentAt: iso(7), incidentLog: [{ id: 'inc_4', description: 'سقوط أداة من ارتفاع أثناء صيانة التوربين — دون إصابات', at: iso(7) }, { id: 'inc_5', description: 'عطل مفاجئ في نظام الفرملة الهوائية', at: iso(30) }, { id: 'inc_6', description: 'إصابة يد أثناء تركيب شفرة — إجازة يومين', at: iso(70) }] },
    ]);

    await blob('anonymousReports', [
      { id: 'anr_d_1', anonymousId: 'ANON-7F3A21B0', stationId: 'st_d_5', type: 'risk_report', priority: 'high', message: 'معدات الحماية الشخصية في محطة أبها غير كافية لفريق الصيانة الليلي.', status: 'open', escalationLevel: 0, replies: [], files: [], createdAt: iso(3) },
      { id: 'anr_d_2', anonymousId: 'ANON-2C91E4D8', stationId: 'st_d_2', type: 'suggestion', priority: 'medium', message: 'اقتراح: تدوير أعدل لمناوبات نهاية الأسبوع بين الفرق.', status: 'in_review', escalationLevel: 0, replies: [{ level: 0, role: 'station_manager', authorName: 'عمر الدوسري', text: 'جاري مراجعة جدول المناوبات مع الموارد البشرية.', files: [], createdAt: iso(6) }], files: [], createdAt: iso(9) },
      { id: 'anr_d_3', anonymousId: 'ANON-9A44C1F2', stationId: 'st_d_1', type: 'complaint', priority: 'high', message: 'تأخر صرف بدل العمل الإضافي لشهر مايو.', status: 'closed', resolution: 'approved', escalationLevel: 1, replies: [{ level: 0, role: 'station_manager', authorName: 'نورة السبيعي', text: 'تم الرفع للإدارة المالية.', files: [], createdAt: iso(40) }, { level: 1, role: 'employee', authorName: 'سارة الحربي', text: 'تمت المعالجة وصرف المستحقات بالكامل.', files: [], createdAt: iso(35) }], files: [], createdAt: iso(45) },
    ]);

    await blob('publicReports', [
      { id: 'pub_d_1', authorId: 'emp_d_e5', authorName: 'ماجد العنزي', stationId: 'st_d_3', type: 'complaint', priority: 'medium', message: 'تكييف غرفة التحكم متعطل منذ 3 أيام ويؤثر على الأجهزة.', status: 'open', replies: [], createdAt: iso(2) },
      { id: 'pub_d_2', authorId: 'emp_d_e9', authorName: 'يوسف البقمي', stationId: 'st_d_5', type: 'risk_report', priority: 'high', message: 'إضاءة ساحة المستودع الخارجية لا تعمل — خطر أثناء المناوبة الليلية.', status: 'in_review', replies: [{ authorName: 'بدر الغامدي', text: 'تم طلب قطع الغيار، الإصلاح خلال 48 ساعة.', createdAt: iso(1) }], createdAt: iso(4) },
    ]);

    await blob('reports', [
      { id: 'rep_d_1', title: 'تقرير الوردية الصباحية — الرياض', content: 'جميع الأنظمة تعمل بكفاءة 98.2%. تمت معالجة إنذارين ثانويين.', stationId: 'st_d_1', authorId: 'emp_d_e1', status: 'approved', createdAt: iso(1) },
      { id: 'rep_d_2', title: 'تقرير إنتاج التحلية اليومي', content: 'الإنتاج 61,300 م³ — ضمن المستهدف. جودة المياه مطابقة للمواصفات.', stationId: 'st_d_2', authorId: 'emp_d_e3', status: 'approved', createdAt: iso(1) },
      { id: 'rep_d_3', title: 'تقرير صيانة التوربينات — أبها', content: 'اكتمال صيانة التوربينات 1-4، جارٍ العمل على 5-7.', stationId: 'st_d_5', authorId: 'emp_d_e9', status: 'pending', createdAt: iso(0) },
    ]);

    await blob('plans', [
      { id: 'plan_d_1', title: 'الصيانة الوقائية للربع الثالث', stationId: 'st_d_1', startDate: future(7), endDate: future(21), status: 'scheduled', notes: 'صيانة شاملة للعواكس وأنظمة التتبع الشمسي.' },
      { id: 'plan_d_2', title: 'استبدال أغشية التناضح العكسي', stationId: 'st_d_2', startDate: future(10), endDate: future(14), status: 'scheduled', notes: 'استبدال أغشية الوحدة B بالكامل.' },
      { id: 'plan_d_3', title: 'فحص شفرات التوربينات السنوي', stationId: 'st_d_5', startDate: future(3), endDate: future(9), status: 'scheduled', notes: 'فحص بالمناظير + موازنة ديناميكية.' },
    ]);

    // Files section: folders + documents
    await blob('files', [
      { id: 'fold_d_1', type: 'folder', name: 'السياسات والإجراءات', parentId: null, createdAt: iso(90) },
      { id: 'fold_d_2', type: 'folder', name: 'تقارير الصيانة', parentId: null, createdAt: iso(90) },
      { id: 'fold_d_3', type: 'folder', name: 'شهادات السلامة (HSE)', parentId: null, createdAt: iso(90) },
      { id: 'fold_d_4', type: 'folder', name: '2026', parentId: 'fold_d_2', createdAt: iso(60) },
      { id: 'file_d_1', type: 'file', name: 'سياسة السلامة العامة.pdf', parentId: 'fold_d_1', url: 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png', size: 245000, mimeType: 'application/pdf', uploadedBy: 'emp_d_dir', createdAt: iso(80) },
      { id: 'file_d_2', type: 'file', name: 'دليل إجراءات الطوارئ.pdf', parentId: 'fold_d_1', url: 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png', size: 512000, mimeType: 'application/pdf', uploadedBy: 'emp_d_ops', createdAt: iso(70) },
      { id: 'file_d_3', type: 'file', name: 'تقرير صيانة يونيو 2026.pdf', parentId: 'fold_d_4', url: 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png', size: 380000, mimeType: 'application/pdf', uploadedBy: 'emp_d_m1', createdAt: iso(20) },
    ]);

    // Weekly shift schedule for the Riyadh station
    const assignments = {};
    for (const day of [0, 1, 2, 3, 4]) {
      assignments[day] = { sft_d_1: ['emp_d_e1', 'emp_d_e2'], sft_d_2: ['emp_d_e1'], sft_d_3: [] };
    }
    await blob('schedules', [{
      id: 'sch_d_1', stationId: 'st_d_1',
      shiftTypes: [
        { id: 'sft_d_1', label: 'الوردية الصباحية', start: '07:00', end: '15:00' },
        { id: 'sft_d_2', label: 'الوردية المسائية', start: '15:00', end: '23:00' },
        { id: 'sft_d_3', label: 'الوردية الليلية', start: '23:00', end: '07:00' },
      ],
      assignments,
    }]);

    await blob('notifications', [
      { id: 'ntf_d_1', userId: 'emp_d_dir', text: 'بلاغ مخاطر جديد (أولوية عالية) في محطة أبها.', read: false, createdAt: iso(0) },
      { id: 'ntf_d_2', userId: 'emp_d_dir', text: 'بيانات السلامة لمحطة أبها بانتظار الاعتماد.', read: false, createdAt: iso(1) },
      { id: 'ntf_d_3', userId: 'emp_d_dir', text: 'طلب إجازة جديد من سلطان الرشيدي بانتظار المراجعة.', read: false, createdAt: iso(1) },
    ]);

    await blob('templates', [
      { id: 'tpl_d_1', title: 'الصيانة الوقائية الشهرية', description: 'الروتين الشهري القياسي للصيانة.', dailyTarget: 40 },
      { id: 'tpl_d_2', title: 'الجولة اليومية للسلامة', description: 'جولة على جميع المناطق وتسجيل الملاحظات.', dailyTarget: 1 },
    ]);

    for (const cat of ['tasks', 'targets', 'hrLevels', 'hrClusters', 'personalPlaces', 'personalAttendance', 'plannerItems', 'journalEntries']) {
      await blob(cat, []);
    }

    /* ---------- signed documents (signatures) ---------- */
    await svc.SignedDocument.bulkCreate([
      { verificationId: 'PWC-D3M0-A1B2-C3D4', fileHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', signerName: 'تركي المطيري', signerId: 'emp_d_dir', companyId: COMPANY_ID, fileName: 'عقد صيانة المحطات 2026.pdf', signedAt: iso(15) },
      { verificationId: 'PWC-D3M0-E5F6-G7H8', fileHash: 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1', signerName: 'سارة الحربي', signerId: 'emp_d_ops', companyId: COMPANY_ID, fileName: 'محضر اجتماع لجنة السلامة.pdf', signedAt: iso(8) },
      { verificationId: 'PWC-D3M0-I9J0-K1L2', fileHash: 'c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2', signerName: 'نورة السبيعي', signerId: 'emp_d_m1', companyId: COMPANY_ID, fileName: 'تقرير التفتيش الدوري — الرياض.pdf', signedAt: iso(3) },
    ]);

    /* ---------- Supabase: targets, folders, attendance, roster ---------- */
    const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '').replace(/\/rest\/v\d+$/, '');
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = { done: false };
    if (SUPABASE_URL && SERVICE_KEY) {
      const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };
      const del = (path) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: 'DELETE', headers });
      const post = (table, rows) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(rows) });

      // wipe previous demo rows
      await del(`attendance?company_id=eq.${COMPANY_ID}`);
      await del(`employees_directory?company_id=eq.${COMPANY_ID}`);
      await del('targets?manager_id=in.(emp_d_dir,emp_d_ops,emp_d_pgm,emp_d_m1,emp_d_m2,emp_d_m3,emp_d_m4,emp_d_m5)');
      await del('task_folders?station_id=in.(st_d_1,st_d_2,st_d_3,st_d_4,st_d_5)');

      // task folders (sections)
      await post('task_folders', [
        { station_id: 'st_d_1', path: 'الصيانة الوقائية', sort_order: 0 },
        { station_id: 'st_d_1', path: 'التشغيل اليومي', sort_order: 1 },
        { station_id: 'st_d_1', path: 'السلامة (HSE)', sort_order: 2 },
        { station_id: 'st_d_2', path: 'صيانة الأغشية', sort_order: 0 },
        { station_id: 'st_d_2', path: 'جودة المياه', sort_order: 1 },
        { station_id: 'st_d_3', path: 'التوربينات', sort_order: 0 },
        { station_id: 'st_d_5', path: 'صيانة التوربينات', sort_order: 0 },
      ]);

      // tasks (targets) across statuses
      // PostgREST bulk insert requires identical keys on every row.
      const tg = (o) => ({ completed_tasks: 0, priority: 'medium', status: 'active', assignment_type: 'member', assignment_id: null, comments: [], completion_proof: null, pre_review_completed: null, task_type: null, section: null, ...o });
      const tRes = await post('targets', [
        tg({ title: 'الفحص الشهري للعواكس الشمسية', description: 'فحص 240 عاكسًا وتوثيق القراءات.', employee_id: 'emp_d_e1', station_id: 'st_d_1', section: 'الصيانة الوقائية', manager_id: 'emp_d_m1', task_target: 240, days: 20, completed_tasks: 156, start_date: iso(12), end_date: future(8), priority: 'high' }),
        tg({ title: 'تنظيف الألواح — القطاع الشمالي', description: 'تنظيف دوري لألواح القطاع الشمالي.', employee_id: 'emp_d_e2', station_id: 'st_d_1', section: 'التشغيل اليومي', manager_id: 'emp_d_m1', task_target: 30, days: 10, completed_tasks: 30, start_date: iso(15), end_date: iso(5), status: 'completed' }),
        tg({ title: 'الجولة اليومية للسلامة', description: 'جولة سلامة يومية وتوثيق الملاحظات.', employee_id: 'emp_d_e2', station_id: 'st_d_1', section: 'السلامة (HSE)', manager_id: 'emp_d_m1', task_target: 30, days: 30, completed_tasks: 22, start_date: iso(22), end_date: future(8), comments: [{ id: crypto.randomUUID(), user_id: 'emp_d_e2', user_name: 'منى الشهري', content: 'ملاحظة: سياج المنطقة C يحتاج صيانة.', files: [], is_issue: true, created_at: iso(2) }] }),
        tg({ title: 'استبدال أغشية الوحدة B', description: 'استبدال 48 غشاء تناضح عكسي.', employee_id: 'emp_d_e3', station_id: 'st_d_2', section: 'صيانة الأغشية', manager_id: 'emp_d_m2', task_target: 48, days: 14, completed_tasks: 48, start_date: iso(16), end_date: iso(2), status: 'pending_review', completion_proof: [{ url: 'https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/df3e1cbab_generated_image.png', name: 'إثبات الإنجاز.jpg', type: 'image' }], pre_review_completed: 40 }),
        tg({ title: 'تحليل عينات المياه الأسبوعي', description: 'جمع وتحليل 16 عينة أسبوعيًا.', employee_id: 'emp_d_e4', station_id: 'st_d_2', section: 'جودة المياه', manager_id: 'emp_d_m2', task_target: 64, days: 30, completed_tasks: 41, start_date: iso(20), end_date: future(10) }),
        tg({ title: 'معايرة حساسات الضغط', description: 'معايرة 20 حساس ضغط في الوحدة الأولى.', employee_id: 'emp_d_e5', station_id: 'st_d_3', section: 'التوربينات', manager_id: 'emp_d_m3', task_target: 20, days: 7, completed_tasks: 8, start_date: iso(12), end_date: iso(5), status: 'overdue' }),
        tg({ title: 'فحص أنظمة الحماية الكهربائية', description: 'اختبار مرحّلات الحماية الرئيسية.', employee_id: 'emp_d_e6', station_id: 'st_d_3', section: 'التوربينات', manager_id: 'emp_d_m3', task_target: 12, days: 10, completed_tasks: 9, start_date: iso(6), end_date: future(4), priority: 'high' }),
        tg({ title: 'صيانة التوربينات 5-7', description: 'صيانة وقائية شاملة للتوربينات المتبقية.', employee_id: 'emp_d_e9', station_id: 'st_d_5', section: 'صيانة التوربينات', manager_id: 'emp_d_m5', task_target: 3, days: 15, completed_tasks: 1, start_date: iso(5), end_date: future(10), priority: 'high' }),
        tg({ title: 'جرد مستودع قطع الغيار', description: 'جرد شامل للمستودع الرئيسي.', employee_id: 'emp_d_e10', station_id: 'st_d_5', section: 'صيانة التوربينات', manager_id: 'emp_d_m5', task_target: 1, days: 5, completed_tasks: 0, start_date: iso(1), end_date: future(4) }),
        tg({ title: 'تدقيق إجراءات السلامة — فريق المحطة', description: 'مراجعة جماعية لإجراءات السلامة.', assignment_type: 'station_team', assignment_id: 'st_d_4', employee_id: 'st_d_4', station_id: 'st_d_4', manager_id: 'emp_d_m4', task_target: 10, days: 12, completed_tasks: 6, start_date: iso(4), end_date: future(8) }),
      ]);
      const tErr = tRes.ok ? null : await tRes.text();

      // roster + attendance for the last 12 days (skipping Fri/Sat)
      const roster = employees.filter((e) => e.stationId).map((e) => ({ employee_id: e.employeeId, company_id: COMPANY_ID, name: e.name, station_id: e.stationId, manager_id: 'emp_d_dir' }));
      await fetch(`${SUPABASE_URL}/rest/v1/employees_directory`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(roster) });

      const stById = Object.fromEntries(stations.map((s) => [s.stationId, s]));
      const attRows = [];
      const workers = employees.filter((e) => e.role === 'employee');
      for (let d = 0; d < 14; d++) {
        const day = new Date(Date.now() - d * 86400000);
        const dow = day.getDay();
        if (dow === 5 || dow === 6) continue; // Fri/Sat off
        const date = day.toISOString().slice(0, 10);
        workers.forEach((e, i) => {
          const st = stById[e.stationId];
          const r = (d * 7 + i * 3) % 10;
          const status = r === 0 ? 'absent' : r <= 2 ? 'late' : 'present';
          if (status === 'absent') {
            attRows.push({
              company_id: COMPANY_ID, employee_id: e.employeeId, employee_name: e.name, station_id: e.stationId, date,
              check_in_at: null, check_out_at: null, status: 'absent', late_minutes: 0,
              excused: r === 0 && d % 2 === 0, early_checkout: false, work_hours: 0,
              check_in_lat: null, check_in_lng: null, station_lat: null, station_lng: null,
              distance_meters: null, location_status: null,
            });
            return;
          }
          const lateMin = status === 'late' ? 18 + (r * 7) : 0;
          const checkIn = new Date(`${date}T0${status === 'late' ? '8' : '6'}:${String(55 + (i % 5) - (status === 'late' ? 40 - lateMin % 40 : 0)).padStart(2, '0').slice(-2)}:00+03:00`);
          const inAt = new Date(`${date}T07:${String((i * 7) % 50).padStart(2, '0')}:00+03:00`);
          if (status === 'late') inAt.setMinutes(inAt.getMinutes() + lateMin + 20);
          const outAt = new Date(inAt.getTime() + (7.5 + (i % 3) * 0.5) * 3600000);
          attRows.push({
            company_id: COMPANY_ID, employee_id: e.employeeId, employee_name: e.name, station_id: e.stationId, date,
            check_in_at: inAt.toISOString(), check_out_at: outAt.toISOString(), status,
            late_minutes: lateMin, excused: status === 'late' && r === 1, early_checkout: false,
            work_hours: Math.round(((outAt - inAt) / 3600000) * 100) / 100,
            check_in_lat: st.lat, check_in_lng: st.lng, station_lat: st.lat, station_lng: st.lng,
            distance_meters: 25 + (i * 11) % 120, location_status: 'inside',
          });
        });
      }
      const aRes = await post('attendance', attRows);
      const aErr = aRes.ok ? null : await aRes.text();
      supabase.done = true;
      supabase.targetsError = tErr;
      supabase.attendanceError = aErr;
      supabase.attendanceRows = attRows.length;
    }

    /* ---------- sync signal ---------- */
    const sig = await svc.SyncSignal.filter({ companyId: COMPANY_ID });
    if (sig.length) await svc.SyncSignal.update(sig[0].id, { version: (sig[0].version || 0) + 1 });
    else await svc.SyncSignal.create({ companyId: COMPANY_ID, version: 1 });

    return Response.json({
      ok: true, companyId: COMPANY_ID, ownerEmail: OWNER_EMAIL,
      employees: employees.length, stations: stations.length, supabase,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});