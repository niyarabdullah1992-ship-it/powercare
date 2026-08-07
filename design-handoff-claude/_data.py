from pathlib import Path
import re, json
t = Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\NiroVera-HR-System-standalone.html").read_text(encoding="utf-8", errors="replace")
# unescape for reading
u = t.replace("<\\u002F", "</").replace("\\n", "\n").replace('\\"', '"')
# pull kpis array-ish nearby
i = u.find("kpis")
print(u[i:i+800])
print("---TASKSTATS---")
j = u.find("taskStats")
print(u[j:j+600])
print("---GATE---")
k = u.find("gateText")
print(u[k:k+500])
print("---ITEM STYLE---")
# find active nav style construction
for m in re.finditer(r"dot:|item\.style|background:#16274F|padding:8px 12px", u):
    if m.start() > 1260000:
        print(m.group(), "at", m.start())
        print(u[m.start()-80:m.start()+200])
        print("---")
        break
# copy to public for viewing
pub = Path(r"C:\Users\Niyar\Documents\powercare\public\claude-handoff-hr.html")
pub.write_bytes(Path(r"C:\Users\Niyar\Downloads\NiroVera HR System (standalone).html").read_bytes())
print("public", pub.exists(), pub.stat().st_size)
