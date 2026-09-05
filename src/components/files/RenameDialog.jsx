import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

export default function RenameDialog({ open, onOpenChange, initialName, onRename }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [name, setName] = useState(initialName || "");

  useEffect(() => {
    if (open) setName(initialName || "");
  }, [open, initialName]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">{ar ? "تعديل الاسم" : "Rename"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus dir="auto" className="font-body" />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-body">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={!name.trim()} className="font-body">
              {ar ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}