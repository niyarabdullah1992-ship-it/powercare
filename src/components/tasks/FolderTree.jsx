import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronRight, Home, Folder, Plus, Pencil, Trash2, GripVertical, ListTodo } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { getParentPath, getLeafName } from "@/lib/taskFolders";
import { groupTasksByPeriod, SCOPE_BADGES } from "@/lib/taskTimeScope";

// Flat folder browser (no visual nesting): shows only the current folder's own
// subfolders and tasks as independent cards. Opening a subfolder navigates into
// it (breadcrumb replaces the view) instead of expanding it inline. Folder cards
// and breadcrumb crumbs both act as drop targets so a task can be dragged onto
// them to move it there.
export default function FolderTree({
  stationId, currentPath, onNavigate, folders, tasksAll, canManage,
  renderTask, filterTasks, onAddFolder, onRenameFolder, onDeleteFolder,
  t, dir, lang,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingPath, setRenamingPath] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  const children = folders
    .filter((f) => f.station_id === stationId && getParentPath(f.path) === currentPath)
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  const directTasks = filterTasks(tasksAll.filter((tg) => (tg.section || null) === currentPath));
  // Time-scope archive: annual goals first, then half-year, quarters, then months.
  const periodGroups = groupTasksByPeriod(directTasks, lang, t);
  const isEmpty = children.length === 0 && directTasks.length === 0;
  const key = currentPath || "root";

  // Breadcrumb segments from root down to the current folder.
  const crumbs = [];
  if (currentPath) {
    const parts = currentPath.split("/");
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      crumbs.push({ name: part, path: acc });
    }
  }

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddFolder(currentPath, name);
    setNewName("");
    setAdding(false);
  };

  const submitRename = (path) => {
    const name = renameVal.trim();
    if (name && name !== getLeafName(path)) onRenameFolder(path, name);
    setRenamingPath(null);
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm font-body">
        <Droppable droppableId="crumb-root" type="TASK">
          {(provided, snapshot) => (
            <button
              ref={provided.innerRef}
              {...provided.droppableProps}
              type="button"
              onClick={() => onNavigate(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${!currentPath ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"} ${snapshot.isDraggingOver ? "bg-accent/15 ring-1 ring-accent/40" : ""}`}
            >
              <Home className="w-3.5 h-3.5" />
              {provided.placeholder}
            </button>
          )}
        </Droppable>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.path}>
            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 ${dir === "rtl" ? "rotate-180" : ""}`} />
            <Droppable droppableId={`crumb-${c.path}`} type="TASK">
              {(provided, snapshot) => (
                <button
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  type="button"
                  onClick={() => onNavigate(c.path)}
                  className={`px-2 py-1 rounded-md transition-colors ${i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"} ${snapshot.isDraggingOver ? "bg-accent/15 ring-1 ring-accent/40" : ""}`}
                >
                  {c.name}
                  {provided.placeholder}
                </button>
              )}
            </Droppable>
          </React.Fragment>
        ))}
      </div>

      {canManage && (
        adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAdding(false); }}
              placeholder={t("newSectionPlaceholder")}
              className="flex-1 max-w-xs px-2.5 py-1.5 rounded-md border border-input text-xs font-body focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button type="button" onClick={submitAdd} className="px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
            <button type="button" onClick={() => setAdding(false)} className="px-2.5 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium font-body border border-dashed border-accent/50 text-accent hover:bg-accent/10 hover:border-accent transition-colors">
            <Plus className="w-3.5 h-3.5" /> {t("addSection")}
          </button>
        )
      )}

      {/* Subfolders — independent cards, no nesting */}
      {children.length > 0 && (
        <Droppable droppableId={`folders-${key}`} type="FOLDER">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-2.5">
              {children.map((f, index) => (
                <Draggable key={f.path} draggableId={`folder::${f.path}`} index={index} isDragDisabled={!canManage}>
                  {(dragProvided, dragSnapshot) => {
                    const subCount = folders.filter((sf) => sf.station_id === stationId && getParentPath(sf.path) === f.path).length;
                    const taskCount = tasksAll.filter((tg) => (tg.section || null) === f.path).length;
                    return (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={dragSnapshot.isDragging ? "opacity-90 shadow-lg" : ""}>
                        <Droppable droppableId={`foldercard-${f.path}`} type="TASK">
                          {(dropProvided, dropSnapshot) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                              className={`group flex items-center gap-2.5 p-4 sm:p-3 rounded-xl border transition-all ${dropSnapshot.isDraggingOver ? "border-accent bg-accent/10 ring-2 ring-accent/30" : "border-border bg-background hover:shadow-sm hover:border-accent/40"}`}
                            >
                              {canManage && (
                                <span {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground shrink-0">
                                  <GripVertical className="w-4 h-4" />
                                </span>
                              )}
                              <button type="button" onClick={() => onNavigate(f.path)} className="flex items-center gap-2.5 flex-1 min-w-0 text-start">
                                <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                                  <Folder className="w-4 h-4" />
                                </span>
                                {renamingPath === f.path ? (
                                  <input
                                    autoFocus
                                    value={renameVal}
                                    onChange={(e) => setRenameVal(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename(f.path); } if (e.key === "Escape") setRenamingPath(null); }}
                                    onBlur={() => submitRename(f.path)}
                                    className="flex-1 px-2 py-1 rounded-md border border-input text-sm font-body"
                                  />
                                ) : (
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium font-body truncate">{getLeafName(f.path)}</p>
                                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground font-body mt-0.5">
                                      {subCount > 0 && <span className="inline-flex items-center gap-1"><Folder className="w-2.5 h-2.5" /> {subCount}</span>}
                                      {taskCount > 0 && <span className="inline-flex items-center gap-1"><ListTodo className="w-2.5 h-2.5" /> {taskCount}</span>}
                                      {subCount === 0 && taskCount === 0 && t("folderEmpty")}
                                    </p>
                                  </div>
                                )}
                              </button>
                              {canManage && renamingPath !== f.path && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                                  <button type="button" onClick={() => { setRenameVal(getLeafName(f.path)); setRenamingPath(f.path); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <ConfirmDeleteDialog
                                    onConfirm={() => onDeleteFolder(f.path)}
                                    trigger={
                                      <button type="button" className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    }
                                  />
                                </div>
                              )}
                              {dropProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      {/* Tasks directly inside this folder */}
      <Droppable droppableId={`tasks-${key}`} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-accent/10 ring-2 ring-accent/30 p-1.5" : ""}`}
            style={{ minHeight: 10 }}
          >
            {(() => {
              let runningIdx = 0;
              return periodGroups.map((grp) => {
                const badge = SCOPE_BADGES[grp.scope.type];
                return (
                  <React.Fragment key={grp.key}>
                    <div className="flex items-center gap-2 pt-2">
                      <p className={`text-xs font-body font-semibold ${grp.scope.type === "yearly" ? "text-amber-700" : "text-muted-foreground"}`}>{grp.label}</p>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-body ${badge.cls}`}>{t(badge.key)}</span>
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-[10px] text-muted-foreground font-body">{grp.tasks.length}</span>
                    </div>
                    {grp.tasks.map((tg) => {
                      const idx = runningIdx++;
                      return (
                        <Draggable key={tg.id} draggableId={`task::${tg.id}`} index={idx} isDragDisabled={!canManage}>
                          {(taskProvided, taskSnapshot) => (
                            <div ref={taskProvided.innerRef} {...taskProvided.draggableProps} {...taskProvided.dragHandleProps} className={taskSnapshot.isDragging ? "opacity-90 shadow-lg" : ""}>
                              {renderTask(tg)}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </React.Fragment>
                );
              });
            })()}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {isEmpty && <p className="text-xs text-muted-foreground font-body py-1">{t("folderEmpty")}</p>}
    </div>
  );
}