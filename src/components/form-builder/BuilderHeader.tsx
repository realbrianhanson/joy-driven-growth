import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormSettings } from "./types";

interface Props {
  settings: FormSettings;
  setSettings: React.Dispatch<React.SetStateAction<FormSettings>>;
  onBack: () => void;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveDisabled?: boolean;
}

export function BuilderHeader({ settings, setSettings, onBack, onPreview, onSave, isSaving, saveDisabled }: Props) {
  return (
    <div className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Forms
          </Button>
          <span className="text-border" aria-hidden>/</span>
          <Input
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="text-[15px] font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 max-w-[320px]"
          />
          <span className="inline-flex items-center gap-1.5 ml-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${settings.status ? "bg-success" : "bg-muted-foreground/40"}`}
              aria-hidden
            />
            {settings.status ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" className="h-8" onClick={onSave} disabled={isSaving || saveDisabled}>
            {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}