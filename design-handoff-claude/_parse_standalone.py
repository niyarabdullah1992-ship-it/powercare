from pathlib import Path
import re
p = Path(r"C:\Users\Niyar\Downloads\NiroVera HR System (standalone).html")
t = p.read_text(encoding="utf-8", errors="replace")
# find comments / screen markers
comments = re.findall(r"<!--\s*(.*?)\s*-->", t)
print("comments", len(comments))
for c in comments[:50]:
    print("-", c[:120])
# style colors
hexes = sorted(set(re.findall(r"#[0-9A-Fa-f]{3,8}", t)))
print("hex count", len(hexes))
print("sample", [h for h in hexes if h.upper() in ("#0B1A3F","#0E7A4B","#F7F8FA","#E4E7EC","#101828","#16274F")][:20])
# GROUPS
m = re.search(r"const GROUPS\s*=\s*(\[[\s\S]{0,3000}?\]);", t)
print("GROUPS", bool(m))
if m:
    print(m.group(1)[:1500])
# iframe or blob?
print("iframe", "iframe" in t.lower())
print("blob", "Blob" in t)
print("data:text/html", "data:text/html" in t[:50000])
# find sc-if screens
screens = re.findall(r"is([A-Z][A-Za-z]+)", t)
from collections import Counter
print("isX top", Counter(screens).most_common(30))
# copy into project for reference
dest = Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\NiroVera-HR-System-standalone.html")
dest.write_bytes(p.read_bytes())
print("copied", dest, dest.stat().st_size)
