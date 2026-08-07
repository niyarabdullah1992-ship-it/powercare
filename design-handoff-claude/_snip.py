from pathlib import Path
import re
t = Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\NiroVera-HR-System-standalone.html").read_text(encoding="utf-8", errors="replace")
# Extract inner design HTML if blob/base64
# look for template or source
for pat in [r'__bundler_src\s*=\s*"([^"]+)"', r'srcdoc="', r'createObjectURL', r'atob\(', r'Uint8Array']:
    print(pat, bool(re.search(pat, t[:20000])))
# find where actual UI starts - aside NiroVera
idx = t.find("منظومة الموارد البشرية")
print("brand idx", idx)
print(t[idx-400:idx+800] if idx>0 else "none")
# dashboard block
i = t.find("<!-- لوحة المعلومات -->")
print("dash", i)
Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\standalone-dashboard-snippet.html").write_text(t[i:i+4500] if i>=0 else "", encoding="utf-8")
j = t.find("<!-- المهام -->")
Path(r"C:\Users\Niyar\Documents\powercare\design-handoff-claude\standalone-tasks-snippet.html").write_text(t[j:j+5000] if j>=0 else "", encoding="utf-8")
print("wrote snippets", j)
# kpi labels from script data
for key in ["kpis", "requests", "week", "alerts", "taskStats", "gateText"]:
    m = re.search(rf"{key}\s*[:=]\s*", t)
    print(key, "at", m.start() if m else None)
