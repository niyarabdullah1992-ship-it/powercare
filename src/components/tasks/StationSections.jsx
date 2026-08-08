import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ArrowLeft, Folder, GripVertical, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { getLeafName, NO_SECTION } from "@/lib/taskFolders";
import { groupTasksByPeriod, SCOPE_BADGES } from "@/lib/taskTimeScope";

export default function StationSections({ stationId, currentPath, onNavigate, folders, tasksAll, canManage, renderTask, filterTasks, onAddFolder, onRenameFolder, onDeleteFolder, onCreateTask, t, dir, lang }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingPath, setRenamingPath] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const sections = folders.filter((folder) => folder.station_id === stationId).sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  const unsectionedCount = tasksAll.filter((task) => !task.section).length;
  const directTasks = currentPath === NO_SECTION ? tasksAll.filter((task) => !task.section) : tasksAll.filter((task) => task.section === currentPath);
  const periodGroups = groupTasksByPeriod(filterTasks(directTasks), lang, t);

  const addSection = async () => {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    const saved = await onAddFolder(null, name);
    setSaving(false);
    if (!saved) return;
    setNewName("");
    setAdding(false);
  };

  const renameSection = (path) => {
    const name = renameVal.trim();
    if (name && name !== getLeafName(path)) onRenameFolder(path, name);
    setRenamingPath(null);
  };

  if (!currentPath) return (
    <div className="space-y-3">
      {canManage && (adding ? (
        <div className="flex items-center gap-2">
          <input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSection(); } if (event.key === "Escape") setAdding(false); }} placeholder={t("newSectionPlaceholder")} className="max-w-xs flex-1 rounded-md border border-input px-2.5 py-1.5 text-xs font-body" />
          <button type="button" onClick={addSection} disabled={saving} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background disabled:opacity-50">{t("save")}</button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-md border border-border px-2.5 py-1.5 text-xs">{t("cancel")}</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-lg border border-dashed border-accent/50 px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/10"><Plus className="h-3.5 w-3.5" /> {t("addSection")}</button>
      ))}

      <Droppable droppableId="folders-root" type="FOLDER">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => {
              const count = tasksAll.filter((task) => task.section === section.path).length;
              return (
                <Draggable key={section.id || section.path} draggableId={`folder::${section.path}`} index={index} isDragDisabled={!canManage}>
                  {(dragProvided, snapshot) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={snapshot.isDragging ? "opacity-90 shadow-lg" : ""}>
                      <Droppable droppableId={`foldercard-${section.path}`} type="TASK">
                        {(dropProvided, dropSnapshot) => (
                          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className={`group flex items-center gap-2.5 rounded-xl border p-4 ${dropSnapshot.isDraggingOver ? "border-accent bg-accent/10" : "border-border bg-background hover:border-accent/40"}`}>
                            {canManage && <span {...dragProvided.dragHandleProps} className="cursor-grab text-muted-foreground"><GripVertical className="h-4 w-4" /></span>}
                            <button type="button" onClick={() => onNavigate(section.path)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent"><Folder className="h-4 w-4" /></span>
                              <span className="min-w-0"><span className="block truncate text-sm font-medium">{getLeafName(section.path)}</span><span className="flex items-center gap-1 text-[11px] text-muted-foreground"><ListTodo className="h-3 w-3" /> {count}</span></span>
                            </button>
                            {canManage && renamingPath !== section.path && <div className="flex opacity-0 transition group-hover:opacity-100">
                              <button type="button" onClick={() => { setRenameVal(getLeafName(section.path)); setRenamingPath(section.path); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                              <ConfirmDeleteDialog onConfirm={() => onDeleteFolder(section.path)} trigger={<button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>} />
                            </div>}
                            {renamingPath === section.path && <input autoFocus value={renameVal} onChange={(event) => setRenameVal(event.target.value)} onBlur={() => renameSection(section.path)} onKeyDown={(event) => { if (event.key === "Enter") renameSection(section.path); if (event.key === "Escape") setRenamingPath(null); }} className="w-28 rounded-md border border-input px-2 py-1 text-sm" />}
                            {dropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {unsectionedCount > 0 && <button type="button" onClick={() => onNavigate(NO_SECTION)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-start sm:w-auto"><Folder className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{t("noSection")} · {unsectionedCount}</span></button>}
      {sections.length === 0 && unsectionedCount === 0 && <p className="py-2 text-sm text-muted-foreground">{t("folderEmpty")}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/20 bg-secondary/30 p-3">
        <button type="button" onClick={() => onNavigate(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}</button>
        <h4 className="font-heading text-lg font-semibold">{currentPath === NO_SECTION ? t("noSection") : getLeafName(currentPath)}</h4>
        {canManage && currentPath !== NO_SECTION && <button type="button" onClick={() => onCreateTask(currentPath)} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> {t("newTaskTarget")}</button>}
      </div>
      <Droppable droppableId={`tasks-${currentPath}`} type="TASK">
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-3 rounded-lg ${snapshot.isDraggingOver ? "bg-accent/10 p-1.5 ring-2 ring-accent/30" : ""}`}>
            {periodGroups.map((group, groupIndex) => {
              const badge = SCOPE_BADGES[group.scope.type];
              const indexOffset = periodGroups.slice(0, groupIndex).reduce((sum, item) => sum + item.tasks.length, 0);
              return <React.Fragment key={group.key}><div className="flex items-center gap-2 pt-2"><p className="text-xs font-semibold text-muted-foreground">{group.label}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] ${badge.cls}`}>{t(badge.key)}</span><span className="h-px flex-1 bg-border" /></div>{group.tasks.map((task, index) => <Draggable key={task.id} draggableId={`task::${task.id}`} index={indexOffset + index} isDragDisabled={!canManage}>{(taskProvided, taskSnapshot) => <div ref={taskProvided.innerRef} {...taskProvided.draggableProps} {...taskProvided.dragHandleProps} className={taskSnapshot.isDragging ? "opacity-90 shadow-lg" : ""}>{renderTask(task)}</div>}</Draggable>)}</React.Fragment>;
            })}
            {provided.placeholder}
            {periodGroups.length === 0 && <p className="py-2 text-sm text-muted-foreground">{t("folderEmpty")}</p>}
          </div>
        )}
      </Droppable>
    </div>
  );
}