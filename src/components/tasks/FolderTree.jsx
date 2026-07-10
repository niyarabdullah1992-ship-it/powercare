import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronDown, ChevronRight, FolderClosed, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { getParentPath, getLeafName } from "@/lib/taskFolders";

// Renders one level of the folder hierarchy, recursively — subfolders nest visibly
// under their parent and each folder's own tasks are grouped clearly beneath it,
// so the reader always sees a clean, organized tree instead of a flat mixed list.
export default function FolderTree({
  stationId, path, depth = 0, folders, tasksAll, canManage,
  renderTask, filterTasks, onAddFolder, onRenameFolder, onDeleteFolder, onReorderChildren,
  t, dir, dragHandleProps,
}) {
  const [expanded, setExpanded] = useState(depth <= 1);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(getLeafName(path));

  const children = folders
    .filter((f) => f.station_id === stationId && getParentPath(f.path) === path)
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  const directTasks = filterTasks(tasksAll.filter((tg) => (tg.section || null) === path));
  const isRoot = path === null;

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(children);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorderChildren(path, reordered.map((f) => f.id));
  };

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddFolder(path, name);
    setNewName("");
    setAdding(false);
  };

  const submitRename = () => {
    const name = renameVal.trim();
    if (name && name !== getLeafName(path)) onRenameFolder(path, name);
    setRenaming(false);
  };

  const body = (
    <div className={isRoot ? "space-y-2" : "space-y-2 mt-2"} style={!isRoot ? { paddingInlineStart: 20 } : undefined}>
      {isRoot && canManage && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAdding(false); }}
                placeholder={t("newSectionPlaceholder")}
                className="flex-1 px-2 py-1.5 rounded-md border border-input text-xs font-body"
              />
              <button type="button" onClick={submitAdd} className="px-2 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
              <button type="button" onClick={() => setAdding(false)} className="px-2 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body border border-border hover:bg-muted transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t("addSection")}
            </button>
          )}
        </div>
      )}
      {children.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`folder-${path || "root"}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {children.map((f, index) => (
                  <Draggable key={f.path} draggableId={f.path} index={index} isDragDisabled={!canManage}>
                    {(dragProvided, dragSnapshot) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={dragSnapshot.isDragging ? "opacity-90" : ""}>
                        <FolderTree
                          stationId={stationId}
                          path={f.path}
                          depth={depth + 1}
                          folders={folders}
                          tasksAll={tasksAll}
                          canManage={canManage}
                          renderTask={renderTask}
                          filterTasks={filterTasks}
                          onAddFolder={onAddFolder}
                          onRenameFolder={onRenameFolder}
                          onDeleteFolder={onDeleteFolder}
                          onReorderChildren={onReorderChildren}
                          t={t}
                          dir={dir}
                          dragHandleProps={dragProvided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {directTasks.length > 0 && (
        <div className="space-y-3">
          {directTasks.map((tg) => renderTask(tg))}
        </div>
      )}
      {!isRoot && canManage && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAdding(false); }}
                placeholder={t("newSectionPlaceholder")}
                className="flex-1 px-2 py-1.5 rounded-md border border-input text-xs font-body"
              />
              <button type="button" onClick={submitAdd} className="px-2 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
              <button type="button" onClick={() => setAdding(false)} className="px-2 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted-foreground font-body hover:text-foreground">
              <Plus className="w-3.5 h-3.5" /> {t("addSection")}
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isRoot) return body;

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between gap-2 p-3 group">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2 flex-1 min-w-0 text-start">
          {canManage && dragHandleProps && (
            <span {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 ${dir === "rtl" ? "rotate-180" : ""}`} />}
          <FolderClosed className="w-4 h-4 text-muted-foreground shrink-0" />
          {renaming ? (
            <input
              autoFocus
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") setRenaming(false); }}
              onBlur={submitRename}
              className="flex-1 px-2 py-1 rounded-md border border-input text-sm font-body"
            />
          ) : (
            <span className="text-sm font-medium font-body truncate">{getLeafName(path)}</span>
          )}
          <span className="text-xs text-muted-foreground font-body shrink-0">({children.length + directTasks.length})</span>
        </button>
        {canManage && !renaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            <button type="button" onClick={(e) => { e.stopPropagation(); setRenameVal(getLeafName(path)); setRenaming(true); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <ConfirmDeleteDialog
              onConfirm={() => onDeleteFolder(path)}
              trigger={
                <button type="button" onClick={(e) => e.stopPropagation()} className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>
        )}
      </div>
      {expanded && <div className="px-3 pb-3">{body}</div>}
    </div>
  );
}