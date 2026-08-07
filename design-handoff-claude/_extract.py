from pathlib import Path
import re

base = Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\untitled\project")
t = (base / "NiroVera HR System.dc.html").read_text(encoding="utf-8", errors="replace")
comments = re.findall(r"<!--\s*(.*?)\s*-->", t)
out = Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\screens.txt")
out.write_text("\n".join(comments), encoding="utf-8")
print("comments", len(comments))
for c in comments:
    print("-", c[:120])

wt = (base / "NiroVera Website.dc.html").read_text(encoding="utf-8", errors="replace")
texts = re.findall(r">([^<]{4,80})<", wt)
ar = [x.strip() for x in texts if any("\u0600" <= ch <= "\u06FF" for ch in x)]
seen = []
for x in ar:
    if x not in seen:
        seen.append(x)
(Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\website-ar.txt")).write_text("\n".join(seen[:120]), encoding="utf-8")
print("website ar", len(seen))
for x in seen[:40]:
    print(x)
