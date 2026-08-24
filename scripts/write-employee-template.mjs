import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u16(value) {
  const out = new Uint8Array(2);
  new DataView(out.buffer).setUint16(0, value, true);
  return out;
}

function u32(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, true);
  return out;
}

function concat(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
      name, data,
    ]);
    const central = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  });
  const center = concat(centrals);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(center.length), u32(offset), u16(0),
  ]);
  return concat([...locals, center, end]);
}

function xmlEsc(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function sheetXml(rows, extra = "") {
  const body = (rows || []).map((row, rowIndex) => {
    const cells = (row || []).map((value, colIndex) => {
      const ref = `${colLetter(colIndex)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<sheetData>${body}</sheetData>${extra}</worksheet>`;
}

function workbookXml(sheetNames) {
  const sheets = sheetNames.map((name, index) =>
    `<sheet name="${xmlEsc(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<sheets>${sheets}</sheets></workbook>`;
}

function workbookRels(count) {
  const rels = Array.from({ length: count }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
  + `</Relationships>`;

function contentTypes(count) {
  const overrides = Array.from({ length: count }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml" ContentType="application/xml"/>`
    + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
    + `${overrides}</Types>`;
}

function utf8(text) {
  return new TextEncoder().encode(text);
}

function listValidation(sqref, formula) {
  return `<dataValidation type="list" allowBlank="1" showDropDown="0" sqref="${sqref}"><formula1>${xmlEsc(formula)}</formula1></dataValidation>`;
}

function buildXlsx(sheets) {
  const names = sheets.map((sheet) => sheet.name || "Sheet");
  const files = [
    { name: "[Content_Types].xml", data: utf8(contentTypes(sheets.length)) },
    { name: "_rels/.rels", data: utf8(ROOT_RELS) },
    { name: "xl/workbook.xml", data: utf8(workbookXml(names)) },
    { name: "xl/_rels/workbook.xml.rels", data: utf8(workbookRels(sheets.length)) },
  ];
  sheets.forEach((sheet, index) => {
    files.push({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: utf8(sheetXml(sheet.rows || [], sheet.extra || "")),
    });
  });
  return zipStore(files);
}

const HEADERS = [
  "الاسم", "البريد", "الهوية", "الجوال", "تاريخ التعيين", "القائمة", "المنصب", "الدرجة", "الفرع", "فروع إضافية",
  "الجنسية", "نوع الهوية", "انتهاء الهوية / الإقامة", "تاريخ الميلاد", "الجنس", "الحالة الاجتماعية",
  "رقم الجواز", "انتهاء الجواز",
  "رقم التأمينات الاجتماعية (GOSI)", "رقم التأمين الطبي", "انتهاء التأمين الطبي", "الفحص الطبي",
  "المسمى في منصة قوى", "نوع العقد", "رقم رخصة العمل", "انتهاء رخصة العمل",
  "المؤهل العلمي", "جهة اتصال الطوارئ", "هاتف الطوارئ", "العنوان", "ملاحظات",
  "الحساب البنكي (IBAN)", "الراتب الأساسي", "البدلات",
];

const notes = {
  الاسم: "كما في الهوية. صف بلا اسم يُتخطى.",
  البريد: "بريد الدخول إن وُجد.",
  الهوية: "رقم الهوية الوطنية أو الإقامة — 10 أرقام.",
  الجوال: "رقم الجوال.",
  "تاريخ التعيين": "YYYY-MM-DD. إن تُرك يُستخدم اليوم.",
  القائمة: "من عمود القوائم في ورقة الدليل.",
  المنصب: "مسمّى المنصب من القائمة.",
  الدرجة: "درجة القائمة.",
  الفرع: "فرع العمل (المنزل).",
  "فروع إضافية": "فروع تغطية إضافية مفصولة بفاصلة.",
  الجنسية: "مثال: سعودي.",
  "نوع الهوية": "هوية وطنية أو إقامة.",
  "انتهاء الهوية / الإقامة": "YYYY-MM-DD.",
  "تاريخ الميلاد": "YYYY-MM-DD.",
  الجنس: "ذكر أو أنثى.",
  "الحالة الاجتماعية": "أعزب / متزوج / مطلق / أرمل.",
  "رقم الجواز": "لغير السعوديين.",
  "انتهاء الجواز": "YYYY-MM-DD.",
  "رقم التأمينات الاجتماعية (GOSI)": "رقم الاشتراك في التأمينات.",
  "رقم التأمين الطبي": "رقم الوثيقة.",
  "انتهاء التأمين الطبي": "YYYY-MM-DD.",
  "الفحص الطبي": "نتيجة أو تاريخ الفحص إن وُجد.",
  "المسمى في منصة قوى": "يطابق المسمى الوظيفي.",
  "نوع العقد": "غير محدد المدة أو محدد المدة.",
  "رقم رخصة العمل": "لغير السعوديين.",
  "انتهاء رخصة العمل": "YYYY-MM-DD.",
  "المؤهل العلمي": "أعلى مؤهل.",
  "جهة اتصال الطوارئ": "الاسم.",
  "هاتف الطوارئ": "رقم للتواصل.",
  العنوان: "عنوان السكن.",
  ملاحظات: "أي بيان إضافي.",
  "الحساب البنكي (IBAN)": "SA ثم 22 رقمًا — لملف حماية الأجور.",
  "الراتب الأساسي": "بالريال، بلا فواصل.",
  البدلات: "مجموع البدلات الشهرية بالريال.",
};

const required = new Set(["الاسم", "القائمة", "المنصب", "الدرجة", "الفرع"]);
const blanks = Array.from({ length: 8 }, () => HEADERS.map(() => ""));
const people = [HEADERS, ...blanks];
const last = 80;
const extra = `<dataValidations count="8">${
  listValidation("F2:F80", "'دليل'!$A$2:$A$200")
  + listValidation("G2:G80", "'دليل'!$B$2:$B$200")
  + listValidation("H2:H80", "'دليل'!$C$2:$C$200")
  + listValidation("I2:I80", "'دليل'!$D$2:$D$200")
  + listValidation(`${colLetter(HEADERS.indexOf("نوع الهوية"))}2:${colLetter(HEADERS.indexOf("نوع الهوية"))}${last}`, "'دليل'!$E$2:$E$200")
  + listValidation(`${colLetter(HEADERS.indexOf("الجنس"))}2:${colLetter(HEADERS.indexOf("الجنس"))}${last}`, "'دليل'!$F$2:$F$200")
  + listValidation(`${colLetter(HEADERS.indexOf("الحالة الاجتماعية"))}2:${colLetter(HEADERS.indexOf("الحالة الاجتماعية"))}${last}`, "'دليل'!$G$2:$G$200")
  + listValidation(`${colLetter(HEADERS.indexOf("نوع العقد"))}2:${colLetter(HEADERS.indexOf("نوع العقد"))}${last}`, "'دليل'!$H$2:$H$200")
}</dataValidations>`;

const guide = [["العمود", "مطلوب", "الشرح"], ...HEADERS.map((header) => [header, required.has(header) ? "نعم" : "لا", notes[header] || ""])];
const catalog = [
  ["القوائم", "المناصب", "الدرجات", "الفروع", "نوع الهوية", "الجنس", "الحالة الاجتماعية", "نوع العقد"],
  ["", "", "", "", "هوية وطنية", "ذكر", "أعزب / عزباء", "غير محدد المدة"],
  ["", "", "", "", "إقامة", "أنثى", "متزوج / متزوجة", "محدد المدة"],
  ["", "", "", "", "", "", "مطلق / مطلقة", ""],
  ["", "", "", "", "", "", "أرمل / أرملة", ""],
];

const bytes = buildXlsx([
  { name: "الأشخاص", rows: people, extra },
  { name: "دليل", rows: catalog },
  { name: "شرح الأعمدة", rows: guide },
]);

const out = join(homedir(), "Downloads", "قالب-الموظف-كامل.xlsx");
writeFileSync(out, bytes);
console.log(out);
console.log(bytes.length);
