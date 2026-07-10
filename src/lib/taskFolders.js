// Shared helpers for the hierarchical task-folder tree (MyTasks page).
// Folders are stored as "/"-joined paths so a folder can be nested inside another folder.
export const NO_SECTION = "__none__";

export function getParentPath(path) {
  if (!path) return null;
  const idx = path.lastIndexOf("/");
  return idx === -1 ? null : path.slice(0, idx);
}

export function getLeafName(path) {
  if (!path) return "";
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

export function withAncestors(paths) {
  const set = new Set();
  for (const p of paths) {
    let cur = p;
    while (cur) {
      set.add(cur);
      cur = getParentPath(cur);
    }
  }
  return Array.from(set);
}