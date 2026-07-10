import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Pencil, Trash2, GripVertical, ListTodo } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { getParentPath, getLeafName } from "@/lib/taskFolders";

// Renders one level of the folder hierarchy, recursively — subfolders nest visibly
// under their parent and each folder's own tasks are grouped clearly beneath it.
// A single DragDropContext (owned by the caller) covers the whole tree, so tasks
// can be dragged from any folder's list and dropped directly onto any other folder
// (its header while collapsed, or its task list while expanded) to move them there.
export default function FolderTree({
  stationId, path, depth = 0, folders, tasksAll, canManage,
  renderTask, filterTasks, onAddFolder, onRenameFolder, onDeleteFolder,
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
  const dropKey = path || "root";
  const isEmpty = children.length === 0 && directTasks.length === 0;

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

  const addButton = (
    adding ? (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAdding(false); }}
          placeholder={t("newSectionPlaceholder")}
          className="flex-1 px-2.5 py-1.5 rounded-md border border-input text-xs font-body focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button type="button" onClick={submitAdd} className="px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
        <button type="button" onClick={() => setAdding(false)} className="px-2.5 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
      </div>
    ) : isRoot ? (
      <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium font-body border border-dashed border-accent/50 text-accent hover:bg-accent/10 hover:border-accent transition-colors">
        <Plus className="w-3.5 h-3.5" /> {t("addSection")}
      </button>
    ) : (
      <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body hover:text-accent transition-colors">
        <Plus className="w-3.5 h-3.5" /> {t("addSection")}
      </button>
    )
  );

  const body = (
    <div className={isRoot ? "space-y-3" : "space-y-3 mt-3"} style={!isRoot ? { paddingInlineStart: 18, borderInlineStart: "2px solid hsl(var(--border))", marginInlineStart: 8 } : undefined}>
      {isRoot && canManage && <div>{addButton}</div>}

      {children.length > 0 && (
        <Droppable droppableId={`folder-${dropKey}`} type="FOLDER">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2.5">
              {children.map((f, index) => (
                <Draggable key={f.path} draggableId={`folder::${f.path}`} index={index} isDragDisabled={!canManage}>
                  {(dragProvided, dragSnapshot) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={dragSnapshot.isDragging ? "opacity-90 shadow-lg" : ""}>
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
      )}

      <Droppable droppableId={`tasklist-${dropKey}`} type="TASK">
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className={`space-y-3 rounded-lg transition-colors ${dropSnapshot.isDraggingOver ? "bg-accent/10 ring-2 ring-accent/30 p-1.5" : ""}`}
            style={{ minHeight: 10 }}
          >
            {directTasks.map((tg, idx) => (
              <Draggable key={tg.id} draggableId={`task::${tg.id}`} index={idx} isDragDisabled={!canManage}>
                {(taskProvided, taskSnapshot) => (
                  <div ref={taskProvided.innerRef} {...taskProvided.draggableProps} {...taskProvided.dragHandleProps} className={taskSnapshot.isDragging ? "opacity-90 shadow-lg" : ""}>
                    {renderTask(tg)}
                  </div>
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>

      {!isRoot && canManage && <div>{addButton}</div>}
    </div>
  );

  if (isRoot) return body;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden transition-shadow hover:shadow-sm">
      <Droppable droppableId={`taskdrop-${dropKey}`} type="TASK">
        {(headerProvided, headerSnapshot) => (
          <div
            ref={headerProvided.innerRef}
            {...headerProvided.droppableProps}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 group transition-colors ${headerSnapshot.isDraggingOver ? "bg-accent/15" : "bg-muted/30"}`}
          >
            <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center gap-2.5 flex-1 min-w-0 text-start">
              {canManage && dragHandleProps && (
                <span {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground shrink-0">
                  <GripVertical className="w-4 h-4" />
                </span>
              )}
              {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ${dir === "rtl" ? "rotate-180" : ""}`} />}
              <span className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                {expanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
              </span>
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
              <span className="flex items-center gap-1.5 shrink-0">
                {children.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-body bg-muted px-1.5 py-0.5 rounded-full">
                    <Folder className="w-2.5 h-2.5" /> {children.length}
                  </span>
                )}
                {directTasks.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-body bg-muted px-1.5 py-0.5 rounded-full">
                    <ListTodo className="w-2.5 h-2.5" /> {directTasks.length}
                  </span>
                )}
              </span>
            </button>
            {canManage && !renaming && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button type="button" onClick={(e) => { e.stopPropagation(); setRenameVal(getLeafName(path)); setRenaming(true); }} className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <ConfirmDeleteDialog
                  onConfirm={() => onDeleteFolder(path)}
                  trigger={
                    <button type="button" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  }
                />
              </div>
            )}
            {headerProvided.placeholder}
          </div>
        )}
      </Droppable>
      {expanded && (
        <div className="px-3 pb-3">
          {isEmpty ? <p className="text-xs text-muted-foreground font-body py-1">{t("folderEmpty")}</p> : null}
          {body}
        </div>
      )}
    </div>
  );
}